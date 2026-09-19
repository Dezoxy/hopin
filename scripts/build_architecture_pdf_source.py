#!/usr/bin/env python3
"""Assemble a Structurizr Documentation tab into one Markdown file for Pandoc.

Structurizr's Documentation tab is the Markdown files in the directory named
by `!docs` in workspace.dsl, joined in filename order, with
`![](embed:ViewKey)` lines showing views inline. This does the same for print:

- joins the files and replaces every embed with the PNG exported for that view;
  a diagram at least LANDSCAPE_RATIO times wider than tall gets its own
  landscape page;
- normalises headings so the top level used becomes level 1, whether the files
  use `#` or `##` for their sections;
- appends a "Decisions" section with every ADR the workspace imports with
  `!adrs`, in number order, each on its own page;
- appends the Markdown files listed in an optional `pdf-sections.txt` in the
  architecture directory (one path per line, relative to that directory; `#`
  starts a comment), for documents outside the Documentation tab such as a
  risk register;
- turns links to repository files into plain text, because on paper they lead
  nowhere; web links and in-page anchors stay links;
- appends a "Views" section with every view that the text does not embed, so
  the PDF shows the whole model even when the pages embed nothing;
- writes a YAML header for the Eisvogel cover (project, date, edition) and
  contents page.

Views come from Structurizr's JSON export, not from parsing the DSL, so their
keys, titles and descriptions are exactly what Structurizr sees. The edition is
the last commit that touched the architecture directory, marked when it has
uncommitted changes. The script prints the PDF file name to use, which carries
the same identity as the cover: <project>-architecture-<date>-<edition>.pdf,
with -dirty after the commit when the docs have uncommitted changes.

The generated directory sits inside the architecture directory and holds the
PNG export (`export -format png`) and the JSON export (`export -format json`,
workspace.json) of the same workspace. Image paths in the output are relative
to the architecture directory, so run Pandoc from there.

The canonical copy lives in architect-base (scripts/); repositories copy it
unchanged and wrap it in their own command.

Usage:
    build_architecture_pdf_source.py <architecture-dir> <generated-dir> <output.md>
"""

from __future__ import annotations

import datetime as dt
import json
import re
import struct
import subprocess
import sys
from pathlib import Path

EMBED = re.compile(r"^!\[[^\]]*\]\(embed:([A-Za-z0-9_-]+)\)\s*$")
HEADING = re.compile(r"^(#{1,6})(\s.*)$")
FENCE = re.compile(r"^(```|~~~)")
DOCS_DIRECTIVE = re.compile(r"^\s*!docs\s+(\S+)")
# A Markdown link whose target has no URL scheme and is not an in-page anchor:
# a path in the repository. Images (![...]) are left alone.
REPO_LINK = re.compile(r"(?<!!)\[([^\]]+)\]\((?![A-Za-z][A-Za-z0-9+.-]*:|#)[^)\s]+\)")
# Optional list of extra Markdown files, relative to the architecture directory.
EXTRA_SECTIONS = "pdf-sections.txt"
NEW_PAGE = "```{=latex}\n\\clearpage\n```"
# Structurizr rewrites a link from one ADR to another as an anchor on the
# target's ID, such as (#9). The PDF gives each ADR the anchor adr-<ID>.
ADR_LINK = re.compile(r"\]\(#([^)\s]+)\)")
# Reading order for views the text does not embed: zoom in, then behaviour,
# then where it runs.
VIEW_ORDER = [
    "systemLandscapeViews",
    "systemContextViews",
    "containerViews",
    "componentViews",
    "filteredViews",
    "dynamicViews",
    "deploymentViews",
    "customViews",
    "imageViews",
]
# Structurizr's default software-system blue: the cover rule and a light tint.
COVER_BLUE = "1168BD"
COVER_FILL = "E8F1FB"
# A diagram at least this much wider than tall gets its own landscape page: on
# A4 that enlarges it by 30% to 50%. Narrower ones stay in the text flow.
LANDSCAPE_RATIO = 1.3
# Characters of the edition commit ID on the cover, in the file name and tag.
EDITION_LENGTH = 7
# Wide diagrams get a physically landscape page, so the running header and
# footer lie along the long edge like the diagram. See LANDSCAPE_MACROS.
LANDSCAPE_OPEN = "```{=latex}\n\\landscapepage\n```"
LANDSCAPE_CLOSE = "```{=latex}\n\\portraitpage\n```"
# \pdfpagewidth is a XeTeX primitive, so the PDF engine must stay xelatex.
# geometry cannot change the paper mid-document, so these set it directly:
# the XeTeX page size, the text block with the same 2 cm margins and the
# header/footer Eisvogel reserves, then KOMA recomputes the header width.
# \@colht is LaTeX's page box height; the footer sits below it, so it has to
# follow \textheight or the footer lands off the page or mid-text.
LANDSCAPE_MACROS = r"""```{=latex}
\makeatletter
\newcommand{\hl@setpage}[2]{%
  \clearpage
  \setlength{\pdfpagewidth}{#1}\setlength{\pdfpageheight}{#2}%
  \setlength{\paperwidth}{#1}\setlength{\paperheight}{#2}%
  \setlength{\hoffset}{0pt}\setlength{\voffset}{0pt}%
  \setlength{\oddsidemargin}{\dimexpr 2cm - 1in\relax}%
  \setlength{\evensidemargin}{\oddsidemargin}%
  \setlength{\topmargin}{\dimexpr 2cm - 1in\relax}%
  \setlength{\textwidth}{\dimexpr #1 - 4cm\relax}%
  \setlength{\textheight}{\dimexpr #2 - 4cm - \headheight - \headsep - \footskip\relax}%
  \setlength{\hsize}{\textwidth}\setlength{\linewidth}{\textwidth}%
  \setlength{\columnwidth}{\textwidth}%
  \global\vsize\textheight\global\@colht\textheight\global\@colroom\textheight%
  \KOMAoptions{headwidth=text,footwidth=text}}
\newcommand{\landscapepage}{\hl@setpage{297mm}{210mm}}
\newcommand{\portraitpage}{\hl@setpage{210mm}{297mm}}
\makeatother
```"""


def load_workspace(generated: Path) -> dict:
    path = generated / "workspace.json"
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        sys.exit(f"cannot read {path}: {exc} (export the workspace as JSON first)")


def workspace_views(workspace: dict) -> list[dict]:
    """Every view, zooming in: landscape, context, containers ... deployment.

    The JSON export lists its view collections alphabetically, so the reading
    order is set here; any collection not named comes last.
    """
    collections = workspace.get("views", {})
    names = [name for name in VIEW_ORDER if name in collections]
    names += sorted(name for name in collections if name not in VIEW_ORDER)
    return [
        view
        for name in names
        if isinstance(collections[name], list)
        for view in collections[name]
        if isinstance(view, dict) and "key" in view
    ]


def docs_dir(arch_dir: Path) -> Path:
    """The directory named by the workspace's !docs directive."""
    for line in (arch_dir / "workspace.dsl").read_text().splitlines():
        match = DOCS_DIRECTIVE.match(line)
        if match:
            return arch_dir / match.group(1)
    sys.exit(f"no !docs directive in {arch_dir / 'workspace.dsl'}")


def png_size(path: Path) -> tuple[int, int]:
    """Width and height from the PNG IHDR chunk."""
    with path.open("rb") as handle:
        head = handle.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit(f"{path} is not a PNG")
    width, height = struct.unpack(">II", head[16:24])
    return width, height


def image(view: dict, generated: Path, *, room: bool = False) -> tuple[str, bool]:
    """The view's PNG as Markdown, and whether it needs a landscape page.

    With room, the diagram keeps a fifth of the page free for the heading and
    description placed above it, so all three stay on one page.

    No caption: the exported PNG already carries the view's title and
    description, so a caption would repeat it.
    """
    key = view["key"]
    png = generated / f"{key}.png"
    if not png.exists():
        sys.exit(f"no exported PNG for view {key} in {generated}")
    alt = (view.get("title") or view.get("description") or key).replace('"', "'")
    width, height = png_size(png)
    size = ' width="100%" height="80%"' if room else ""
    markdown = f'![]({generated.name}/{key}.png){{fig-alt="{alt}"{size}}}'
    return markdown, width / height >= LANDSCAPE_RATIO


def on_page(blocks: list[str], landscape: bool) -> str:
    """Markdown blocks, wrapped in a landscape page when the diagram needs one."""
    if landscape:
        blocks = [LANDSCAPE_OPEN, *blocks, LANDSCAPE_CLOSE]
    return "\n\n".join(blocks)


def git(*args: str) -> str:
    return subprocess.run(
        ["git", *args], check=True, capture_output=True, text=True
    ).stdout.strip()


def edition(arch_dir: Path) -> tuple[str, bool]:
    """Short SHA of the last commit touching the model and docs, and whether dirty.

    Always 7 characters, as GitHub shows commits, unless git needs more to be
    unambiguous. Git's automatic length depends on the clone (a CI runner gave
    8 where a laptop gave 7), which would give one model two edition names.
    """
    full = git("log", "-1", "--format=%H", "--", str(arch_dir))
    sha = git("rev-parse", f"--short={EDITION_LENGTH}", full) if full else "uncommitted"
    dirty = bool(git("status", "--porcelain", "--", str(arch_dir)))
    return sha, dirty


def pdf_name(project: str, day: dt.date, sha: str, dirty: bool) -> str:
    """File name with the cover's identity: homelab-architecture-2026-09-18-84f0b41.pdf."""
    slug = re.sub(r"[^a-z0-9]+", "-", project.lower()).strip("-") or "architecture"
    suffix = "-dirty" if dirty else ""
    return f"{slug}-architecture-{day.isoformat()}-{sha}{suffix}.pdf"


def page_lines(pages: list[Path], project: str) -> list[str]:
    """The pages joined; a first line repeating the project name is the cover's."""
    lines: list[str] = []
    for index, page in enumerate(pages):
        text = page.read_text().splitlines()
        if index == 0 and text and text[0].lstrip("#").strip() == project:
            text = text[1:]
        lines.extend([*text, ""])
    return lines


def heading_shift(lines: list[str]) -> int:
    """How many levels to lift headings so the top level used becomes 1."""
    levels, fenced = [], False
    for line in lines:
        if FENCE.match(line):
            fenced = not fenced
        elif not fenced and (match := HEADING.match(line)):
            levels.append(len(match.group(1)))
    return min(levels) - 1 if levels else 0


def plain_links(line: str) -> str:
    """Links to repository files as their text; web links and anchors unchanged."""
    return REPO_LINK.sub(r"\1", line)


def body(
    lines: list[str],
    views: dict[str, dict],
    generated: Path,
    *,
    top: int = 1,
    unnumbered: bool = False,
    anchor: str | None = None,
) -> tuple[str, set[str]]:
    """Lines with headings normalised and embeds replaced; also the embedded keys.

    The top heading level used becomes `top`. With unnumbered, headings carry
    no section number (an ADR has its own), and only the top level is listed
    in the contents, and the first top-level heading gets the anchor.
    """
    shift, fenced = heading_shift(lines) - (top - 1), False
    out: list[str] = []
    embedded: set[str] = set()
    for line in lines:
        if FENCE.match(line):
            fenced = not fenced
        heading = None if fenced else HEADING.match(line)
        embed = None if fenced else EMBED.match(line)
        if heading:
            level = len(heading.group(1)) - shift
            text = plain_links(heading.group(2))
            if unnumbered and level == top and anchor:
                text += f" {{#{anchor} .unnumbered}}"
                anchor = None
            elif unnumbered:
                text += " {.unnumbered}" if level == top else " {.unnumbered .unlisted}"
            out.append("#" * level + text)
        elif embed:
            key = embed.group(1)
            if key not in views:
                sys.exit(f"the documentation embeds {key}, which is not a view")
            markdown, wide = image(views[key], generated)
            out.append(on_page([markdown], wide))
            embedded.add(key)
        else:
            out.append(line if fenced else plain_links(line))
    return "\n".join(out), embedded


def decision_order(decision: dict) -> tuple[int, str]:
    """Numeric IDs in number order, then any others by ID."""
    ident = str(decision.get("id", ""))
    return (int(ident), "") if ident.isdigit() else (sys.maxsize, ident)


def decisions(
    workspace: dict, views: dict[str, dict], generated: Path
) -> tuple[str, set[str]]:
    """A section with every Markdown ADR in the workspace, one per page."""
    records = [
        record
        for record in workspace.get("documentation", {}).get("decisions", [])
        if isinstance(record, dict) and record.get("content")
    ]
    markdown = [record for record in records if record.get("format", "Markdown") == "Markdown"]
    if len(markdown) < len(records):
        print(f"skipped {len(records) - len(markdown)} non-Markdown ADRs", file=sys.stderr)
    if not markdown:
        return "", set()
    ids = {str(record.get("id")) for record in markdown}

    def to_adr(match: re.Match[str]) -> str:
        target = match.group(1)
        return f"](#adr-{target})" if target in ids else match.group(0)

    parts = ["", "# Decisions", "", "Architecture decision records, in number order.", ""]
    embedded: set[str] = set()
    for record in sorted(markdown, key=decision_order):
        content = ADR_LINK.sub(to_adr, record["content"])
        text, keys = body(
            content.splitlines(),
            views,
            generated,
            top=2,
            unnumbered=True,
            anchor=f"adr-{record.get('id')}",
        )
        parts += [NEW_PAGE, "", text, ""]
        embedded |= keys
    return "\n".join(parts), embedded


def extra_sections(
    arch_dir: Path, views: dict[str, dict], generated: Path
) -> tuple[str, set[str]]:
    """The files listed in pdf-sections.txt, each from a new page."""
    listing = arch_dir / EXTRA_SECTIONS
    if not listing.exists():
        return "", set()
    root = arch_dir.resolve()
    parts: list[str] = []
    embedded: set[str] = set()
    for raw in listing.read_text().splitlines():
        entry = raw.split("#", 1)[0].strip()
        if not entry:
            continue
        path = (arch_dir / entry).resolve()
        if root not in path.parents or path.suffix != ".md" or not path.is_file():
            sys.exit(f"{listing}: {entry} is not a Markdown file inside {arch_dir}")
        text, keys = body(path.read_text().splitlines(), views, generated)
        parts += ["", NEW_PAGE, "", text]
        embedded |= keys
    return "\n".join(parts), embedded


def appendix(views: list[dict], embedded: set[str], generated: Path) -> str:
    """A final section with every view the text does not embed."""
    rest = [view for view in views if view["key"] not in embedded]
    if not rest:
        return ""
    parts = ["", "# Views", "", "Views the documentation above does not show.", ""]
    for view in rest:
        # Heading and description go on the diagram's page, landscape or not.
        blocks = [f"## {view.get('title') or view['key']}"]
        if view.get("description"):
            blocks.append(view["description"])
        markdown, wide = image(view, generated, room=True)
        parts += [on_page([*blocks, markdown], wide), ""]
    return "\n".join(parts)


def header(project: str, edition_text: str, today: dt.date) -> str:
    return "\n".join(
        [
            "---",
            f'title: "{project}"',
            'subtitle: "Architecture documentation"',
            f'author: "Edition {edition_text}"',
            f'date: "{today.day} {today:%B %Y}"',
            "lang: en-GB",
            "titlepage: true",
            f'titlepage-color: "{COVER_FILL}"',
            f'titlepage-rule-color: "{COVER_BLUE}"',
            'titlepage-text-color: "1F2937"',
            "toc: true",
            "toc-own-page: true",
            'toc-title: "Contents"',
            "numbersections: true",
            "colorlinks: true",
            # C4 styles often reserve red for a warning; links stay blue.
            "linkcolor: NavyBlue",
            "urlcolor: NavyBlue",
            "toccolor: black",
            'geometry: "a4paper,margin=2cm"',
            "header-includes: |",
            *("  " + line for line in LANDSCAPE_MACROS.splitlines()),
            'float-placement-figure: "H"',
            f'footer-left: "{project} architecture, edition {edition_text}"',
            "---",
            "",
        ]
    )


def main() -> int:
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    arch_dir, generated, output = (Path(arg) for arg in sys.argv[1:])
    if generated.resolve().parent != arch_dir.resolve():
        sys.exit(f"{generated} must be a directory directly inside {arch_dir}")
    workspace = load_workspace(generated)
    views = workspace_views(workspace)
    project = workspace.get("name") or "Architecture"
    pages = sorted(docs_dir(arch_dir).glob("*.md"))
    if not pages:
        sys.exit(f"no Markdown files in {docs_dir(arch_dir)}")
    by_key = {view["key"]: view for view in views}
    text, embedded = body(page_lines(pages, project), by_key, generated)
    adrs, adr_views = decisions(workspace, by_key, generated)
    extra, extra_views = extra_sections(arch_dir, by_key, generated)
    embedded |= adr_views | extra_views
    sha, dirty = edition(arch_dir)
    edition_text = f"{sha} with uncommitted changes" if dirty else sha
    today = dt.datetime.now(dt.UTC).astimezone().date()  # the operator's local date
    output.write_text(
        header(project, edition_text, today)
        + text
        + adrs
        + extra
        + appendix(views, embedded, generated)
    )
    print(
        f"wrote {output} for {project}, edition {edition_text}: "
        f"{len(embedded)} views embedded, "
        f"{len(views) - len(embedded)} in the Views section",
        file=sys.stderr,
    )
    print(pdf_name(project, today, sha, dirty))
    return 0


if __name__ == "__main__":
    sys.exit(main())
