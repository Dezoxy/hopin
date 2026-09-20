#!/usr/bin/env python3
"""Fail when documentation contradicts the tree it documents.

The mechanical half of the /docs-sync audit (.claude/skills/docs-sync/SKILL.md).
It only checks claims derivable from the repo: mirrored files, resolvable
links, indexes, ADR format, the view register and cross-referenced IDs. A green
run means "nothing provably false", not "docs are good".

Every check whose subject is missing is skipped, not failed, so a repository
adopts them as it grows: no docs index, no view register, no speaker notes and
no requirement documents still passes. What exists must be consistent.

The canonical copy lives in architect-base (scripts/); repositories copy it
unchanged.

Run from anywhere: python3 scripts/check_docs_consistency.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ARCH = REPO / "docs" / "architecture"
ADR_DIR = ARCH / "decisions"
ARCH_INDEX = ARCH / "README.md"
DOCS_INDEX = REPO / "docs" / "README.md"
VIEWS_DSL = ARCH / "model" / "views.dsl"

# Generated output and templates with example links are not documentation.
SKIP_DIRS = {"generated", "templates", "node_modules", ".git"}
# Vendored rule sets (for example ECC's) keep upstream's relative links to
# directories installed globally, not in this repo. They are not documentation.
VENDORED = REPO / ".claude" / "rules"

# Cited ID pattern -> the file that must define it (as a table row or heading).
ID_OWNERS = {
    r"\bC-\d{2}\b": ARCH / "requirements" / "constraints.md",
    r"\bQA-\d{2}\b": ARCH / "requirements" / "quality-attributes.md",
    r"\bA-\d{2}\b": ARCH / "requirements" / "assumptions.md",
    r"\bP-\d{2}\b": ARCH / "principles" / "architecture-principles.md",
    r"\bRISK-\d{3}\b": ARCH / "risks" / "architecture-risks.md",
    r"\bTD-\d{3}\b": ARCH / "risks" / "technical-debt.md",
    r"\bT-\d{2}\b": ARCH / "security" / "threat-model.md",
}

ADR_NAME = re.compile(r"^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
ADR_STATUSES = {"Proposed", "Accepted", "Rejected", "Deprecated", "Superseded"}
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
FENCE = re.compile(r"^\s*(```|~~~)")


class Failures(list):
    def add(self, check: str, detail: str) -> None:
        self.append((check, detail))


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def rel(path: Path) -> str:
    return path.relative_to(REPO).as_posix()


def prose(text: str) -> str:
    """The text outside fenced blocks: a sample ADR or risk is an example, not a claim."""
    out, fenced = [], False
    for line in text.splitlines():
        if FENCE.match(line):
            fenced = not fenced
        elif not fenced:
            out.append(line)
    return "\n".join(out)


def markdown_files() -> list[Path]:
    roots = [REPO / "docs", REPO / ".claude", REPO / ".agents"]
    files = [REPO / p for p in ("README.md", "AGENTS.md", "CLAUDE.md")]
    for root in roots:
        files += [
            p for p in root.rglob("*.md")
            if not SKIP_DIRS.intersection(p.relative_to(REPO).parts)
            and VENDORED not in p.parents
        ]
    return [p for p in files if p.exists()]


def check_twins(f: Failures) -> None:
    """AGENTS.md and CLAUDE.md carry the same instructions, byte for byte."""
    if read(REPO / "AGENTS.md") != read(REPO / "CLAUDE.md"):
        f.add("twins", "AGENTS.md and CLAUDE.md differ; edit CLAUDE.md, then cp CLAUDE.md AGENTS.md")


def check_skill_mirror(f: Failures) -> None:
    """.agents/skills/ mirrors .claude/skills/ byte for byte."""
    claude, agents = REPO / ".claude" / "skills", REPO / ".agents" / "skills"
    for src in sorted(claude.glob("*/SKILL.md")):
        mirror = agents / src.parent.name / "SKILL.md"
        if not mirror.exists():
            f.add("skill-mirror", f"{rel(src)} has no mirror at {rel(mirror)}")
        elif mirror.read_bytes() != src.read_bytes():
            f.add("skill-mirror", f"{rel(mirror)} differs from {rel(src)} (the .claude/ copy is the source)")
    for mirror in sorted(agents.glob("*/SKILL.md")):
        if not (claude / mirror.parent.name / "SKILL.md").exists():
            f.add("skill-mirror", f"{rel(mirror)} mirrors a skill that no longer exists")


def check_links(f: Failures) -> None:
    """Every relative markdown link resolves to something on disk."""
    for src in markdown_files():
        for text, link in LINK_RE.findall(prose(read(src))):
            if link.startswith(("http://", "https://", "#", "mailto:")):
                continue
            if not (src.parent / link.split("#")[0]).exists():
                f.add("links", f"{rel(src)}: [{text}]({link}) does not resolve")


def check_docs_index(f: Failures) -> None:
    """Every doc under docs/ is linked from docs/README.md or the architecture README."""
    if not DOCS_INDEX.exists():
        return  # a repository without a docs index has nothing to enforce
    indexes = {DOCS_INDEX: read(DOCS_INDEX), ARCH_INDEX: read(ARCH_INDEX)}
    for doc in sorted((REPO / "docs").rglob("*.md")):
        parts = doc.relative_to(REPO).parts
        if doc in indexes or SKIP_DIRS.intersection(parts) or "decisions" in parts:
            continue
        linked = any(
            (index.parent / link.split("#")[0]).resolve() == doc.resolve()
            for index, text in indexes.items()
            for _, link in LINK_RE.findall(text)
            if not link.startswith(("http://", "https://", "#"))
        )
        if not linked:
            f.add("docs-index", f"{rel(doc)} is not linked from docs/README.md or {rel(ARCH_INDEX)}")


def check_adrs(f: Failures) -> None:
    """ADRs import cleanly into Structurizr and are listed in the architecture README."""
    if not ADR_DIR.is_dir():
        return
    index = read(ARCH_INDEX)
    numbers = []
    for path in sorted(ADR_DIR.iterdir()):
        match = ADR_NAME.match(path.name)
        if not path.is_file() or not match:
            f.add("adrs", f"{rel(path)}: only NNNN-kebab-title.md files belong in decisions/")
            continue
        number = int(match.group(1))
        numbers.append(number)
        lines = read(path).splitlines()
        if not lines or not lines[0].startswith(f"# {number}. "):
            f.add("adrs", f"{rel(path)}: first line must be '# {number}. <title>'")
        if not any(re.fullmatch(r"Date: \d{4}-\d{2}-\d{2}", ln) for ln in lines):
            f.add("adrs", f"{rel(path)}: needs a 'Date: YYYY-MM-DD' line")
        if "## Status" not in lines or "## Context" not in lines:
            f.add("adrs", f"{rel(path)}: needs '## Status' followed by '## Context'")
        else:
            start, end = lines.index("## Status"), lines.index("## Context")
            status = next((ln for ln in lines[start + 1:end] if ln.strip()), "")
            if status.split(" ")[0] not in ADR_STATUSES:
                f.add("adrs", f"{rel(path)}: status must start with one of {sorted(ADR_STATUSES)}")
        if f"(decisions/{path.name})" not in index:
            f.add("adrs", f"{rel(path)} is not listed in {rel(ARCH_INDEX)}")
    if numbers and sorted(numbers) != list(range(1, len(numbers) + 1)):
        f.add("adrs", f"ADR numbers must run 1..{len(numbers)} without gaps: {sorted(numbers)}")


def check_view_register(f: Failures) -> None:
    """The README view register lists exactly the views defined in views.dsl."""
    if not VIEWS_DSL.exists() or "## View register" not in read(ARCH_INDEX):
        return  # no register to reconcile yet
    dsl = read(VIEWS_DSL)
    defined = set(re.findall(
        r'^(?:systemLandscape|systemContext\s+\S+|container\s+\S+|component\s+\S+|'
        r'dynamic\s+\S+|deployment\s+\S+\s+\S+)\s+"([^"]+)"', dsl, re.MULTILINE))
    section = read(ARCH_INDEX).split("## View register", 1)
    registered = set(re.findall(r"^\|\s*([A-Za-z][A-Za-z0-9]+)\s*\|", section[1].split("\n## ", 1)[0], re.MULTILINE)) - {"Key"} if len(section) == 2 else set()
    for key in sorted(defined - registered):
        f.add("view-register", f"view '{key}' is in views.dsl but not in the README view register")
    for key in sorted(registered - defined):
        f.add("view-register", f"view '{key}' is in the README view register but not in views.dsl")


def check_speaker_notes(f: Failures) -> None:
    """Every view in views.dsl has a '### <key>' section in the speaker notes."""
    notes_path = ARCH / "talks" / "speaker-notes.md"
    if not notes_path.exists() or not VIEWS_DSL.exists():
        return  # speaker notes are optional; enforce them once they exist
    notes = set(re.findall(r"^### (\S+)\s*$", read(notes_path), re.MULTILINE))
    defined = set(re.findall(
        r'^(?:systemLandscape|systemContext\s+\S+|container\s+\S+|component\s+\S+|'
        r'dynamic\s+\S+|deployment\s+\S+\s+\S+)\s+"([^"]+)"', read(VIEWS_DSL), re.MULTILINE))
    for key in sorted(defined - notes):
        f.add("speaker-notes", f"view '{key}' has no section in {rel(notes_path)}")
    for key in sorted(notes - defined):
        f.add("speaker-notes", f"{rel(notes_path)} has a section for '{key}', which is not a view")


def check_ids(f: Failures) -> None:
    """Every cited requirement/risk ID is defined in its owning document."""
    sources = markdown_files() + sorted(ARCH.rglob("*.dsl"))
    for pattern, owner in ID_OWNERS.items():
        if not owner.exists():
            continue  # this repository does not keep that ID family
        owner_text = read(owner)
        defined = set(re.findall(r"^(?:\|\s*|#+\s*)(" + pattern.strip(r"\b") + r")\b", owner_text, re.MULTILINE))
        for src in sources:
            for cited in sorted(set(re.findall(pattern, prose(read(src))))):
                if cited not in defined:
                    f.add("ids", f"{rel(src)} cites {cited}, which {rel(owner)} does not define")


CHECKS = (check_twins, check_skill_mirror, check_links, check_docs_index,
          check_adrs, check_view_register, check_speaker_notes, check_ids)


def main() -> int:
    failures = Failures()
    for check in CHECKS:
        check(failures)
    if not failures:
        print(f"docs consistency: {len(CHECKS)} checks passed")
        return 0
    print("docs consistency: documentation contradicts the tree\n", file=sys.stderr)
    for name, detail in failures:
        print(f"  [{name}] {detail}", file=sys.stderr)
    print("\nFix the docs in this branch. See .claude/skills/docs-sync/SKILL.md.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
