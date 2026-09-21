---
name: docs-sync
description: Audit the branch diff for documentation it falsifies and fix those docs in the same branch — run before opening or updating any PR
---

<!-- Adapted from ~/Developer/homelab/.claude/skills/docs-sync/SKILL.md (2026-08-27).
     The method is unchanged; the doc surface and checks are Hopin's. -->

Before a PR leaves this repo, the documentation must still be TRUE. This skill
is a diff-driven audit: find every doc claim the branch falsifies, fix it in the
same branch, and prove the fixes rather than asserting them.

It matters here because Hopin is documentation-first. The plan, the
architecture model, the ADRs and the constraints are the product until code
exists, and much of it is **counted or cross-referenced, not prosed**: step
tables with statuses and dependencies, a view register that must match
`views.dsl`, an ADR index, constraint and requirement IDs (`C-01`, `QA-01`,
`RISK-001`) cited from other files, and a Makefile whose `##` comments *are*
`make help`. Every one of those goes stale silently when something is added or
renamed.

## Steps

1. Get the real change surface — not what you remember doing:

   ```bash
   git diff main...HEAD --stat
   git diff main...HEAD
   ```

   From it, list what the branch changed in these categories: **paths** (files
   or dirs added, removed, renamed), **names** (apps, packages, containers,
   views, ADRs, env vars, secrets, workflows, Make targets), **IDs** (plan
   steps, constraints, quality attributes, assumptions, risks, principles),
   **counts and shapes** (table rows, view lists, tariff values, version pins),
   and **behaviour or contracts** (API routes, events, ride states, fare rules,
   what gates a deploy).

2. Sweep the doc surface for claims touching anything in that list:

   | Where | What it claims |
   | --- | --- |
   | `README.md` | what Hopin is, status, **repository layout tree**, how to run the checks |
   | `docs/README.md` | the docs index — **every doc must be reachable from it or from the architecture README** |
   | `docs/hopin-plan.md` | scope, **step table (status, done-when, depends)**, Part F open decisions, risks summary, changelog; Part E step sections are history |
   | `docs/architecture/README.md` | **view register** (must match `views.dsl`), **ADR index**, reading paths, document index |
   | `docs/architecture/model/*.dsl` | elements, relationships, deployment, views — the model must tell the same story as the prose |
   | `docs/architecture/<concern>/` | requirements, security, data, integration, deployment, reliability, observability, risks, roadmap — each owns its facts and IDs |
   | `docs/architecture/decisions/` | ADRs — history; a changed decision gets a new ADR, not an edit |
   | `docs/compliance/` | dated research memos — history; annotate, never rewrite |
   | `Makefile` `##` comments | these ARE `make help` output |
   | `AGENTS.md` + `CLAUDE.md` | conventions and hard rules — **twins, byte-identical** |
   | `.claude/rules/ecc/` | ECC language rules; `react-native/` has Hopin-narrowed `paths:` |
   | `.github/workflows/` | what CI checks and publishes |

   Cheap sweep that catches most drift: grep the docs for every path, name and
   ID the diff REMOVED or RENAMED.

   ```bash
   git diff main...HEAD --diff-filter=DR --name-only | while read -r f; do
     grep -rn --include='*.md' --include='*.dsl' -F "$f" . && echo "  ^ references removed/renamed $f"
   done
   ```

3. Verify claims, don't re-read them. The counted claims are checked
   mechanically by the same gate CI runs:

   ```bash
   python3 scripts/check_docs_consistency.py
   make check   # Structurizr validate + inspect, when the model or ADRs changed
   ```

   The script checks the `AGENTS.md`/`CLAUDE.md` twins, the `.agents/` skill
   mirror, relative links, the docs index, the ADR format and index, the view
   register against `views.dsl`, that every cited requirement ID is defined in
   its owning document, and that every document the Documentation tab imports
   has a visible `##` title — Structurizr hides a level-1 heading, so a
   `#`-titled document renders with no title while its PDF looks fine. It runs in `.github/workflows/docs-consistency.yml`.

   **A green run means "nothing provably false", not "docs are good."** The
   script cannot read prose. Everything below is still yours:

   - a path a doc names → `ls` it
   - a command a doc gives → run it, or `--help` / dry-run it if it mutates
   - a legal or tariff fact → the source it cites, not memory
   - a rendered view → `make export` and look at the PNG
   - an imported document → `make view`, open the Documentation tab, and
     confirm its title appears in both the page and the navigation. The PDF
     cannot tell you this: it normalises heading levels.
   - a step's status → does the work it names actually exist?

   If you add a doc claim that *could* be checked mechanically, add it to the
   script rather than to this list.

4. Fix what the diff falsified, in this branch. Scope discipline:

   - Fix drift this branch causes, plus outright falsehoods found in passing
     (note the latter in the PR body).
   - Do NOT restyle prose, reorganize docs, or "improve" things that are merely
     imperfect.
   - **Historical text describes what WAS true.** ADRs, plan Part E step
     sections, the plan changelog and dated compliance memos record their
     moment. Supersede with a new ADR, append a dated note, strike through in
     the plan — never rewrite history to match the present.

5. Mind the docs with side effects:

   - **`Makefile` `##` comments** render as `make help`. Re-run `make help`.
   - **`docs/architecture/overview/`** is imported into the Structurizr
     Documentation tab and the architecture PDF. Run `make check`.
   - **This repo is public.** No secrets, internal hostnames, personal data or
     partner names under negotiation in any doc.

6. Close with proof in the PR body: one line per doc touched, saying what was
   false and what verified the fix. If the audit found nothing to fix, say so
   explicitly: "docs audited against the diff, no drift". Silence is not.
