# Hopin

Ride-hailing app for short city trips: passenger app (iOS, Android, Web), driver app (iOS, Android), admin web, and a NestJS backend on AWS. Pre-code: nothing is built yet.

## Where things are

- `docs/hopin-plan.md` is the single living plan: product scope, domain model, the S001–S116 step list and a detail section per started step. Expand steps there. Do not create parallel plan files.
- `docs/hopin-pre-plan.md` is the original product idea. Frozen.
- `docs/architecture/` is the architecture knowledge base: Structurizr model, ADRs, requirements (constraints, quality attributes, assumptions), principles, security, data, integration, deployment, reliability, observability, risks and roadmap. Its README has the view register and the document index.
- `docs/compliance/` holds regulatory research (S002 memo) and, later, the DPIA.
- Planned code layout (plan Part B3): `apps/` (passenger, driver, admin, api, trip-share), `packages/` (shared, ui, api-client), `infra/terraform/`.

## Architecture authoring

- For Structurizr model/view work, read
  `.agents/skills/architecture-views/SKILL.md`.
- For architecture documentation beyond diagrams, read
  `.agents/skills/architecture-docs/SKILL.md`. Use both for mixed requests.
- These skills come from architect-base. Apply this repo's own evidence, paths,
  tool pins and checks. Do not copy the base repo's fictional Payment Platform.
- Use automatic layout and verify rendered readability. Export PNG/SVG manually;
  do not add export automation unless requested.

Hopin specifics:

- Run `make check` after any change under `docs/architecture/model/` or `decisions/`. It must end with no ERROR line.
- Everything in the model is planned, not deployed. Keep "(planned)" in view titles until real infrastructure exists, then check each claim against code and Terraform.
- ADRs use architect-base's template (`docs/architecture/templates/adr.md`), not ECC's `architecture-decision-records` skill format. A new recommendation starts as Proposed. Only list alternatives that were actually considered.
- When a plan step produces real content for a concern (security, reliability, data), move it from the plan into `docs/architecture/<concern>/` and link back. Do not create empty concern files.
- `styles-shared.dsl`, `scripts/architecture-pdf.sh` and `scripts/build_architecture_pdf_source.py` are copied unchanged from `~/Documents/architect-base`. Improve them there first, then re-copy.
- `.github/workflows/architecture-pdf.yml` is architect-base's workflow with one Hopin change: it runs only when started by hand (no pull-request trigger). Re-apply that change after re-copying. Test PDF tooling changes locally with `make pdf`.

## Pull requests and documentation

- All work happens on a branch; `main` accepts changes only through merged pull requests (ruleset `protect-main`).
- **Before opening or updating any pull request, run `/docs-sync`** (`.claude/skills/docs-sync/SKILL.md`): audit the branch diff for documentation it falsifies, fix it in the same branch, and put the proof in the PR body.
- The counted half of that audit is `make docs` (`scripts/check_docs_consistency.py`). It runs in CI with `make check` in `.github/workflows/docs-consistency.yml`. A green run is a floor, not the audit: it cannot read prose.
- docs-sync is adapted from `~/Developer/homelab/.claude/skills/docs-sync/`. Keep `.claude/skills/` and `.agents/skills/` byte-identical.
- Each fact has one owning document. Requirements, security, data, reliability, observability and risks live under `docs/architecture/`; the plan links to them and keeps scope, steps and decisions.

## ECC rules, agents and skills for this stack

ECC is installed globally. Its common rules load from the user's global config. This repo adds the language rules that match Hopin's stack, under `.claude/rules/ecc/`:

| Rule set | Loads for | Note |
|---|---|---|
| typescript | every `.ts`/`.tsx`/`.js`/`.jsx` | Upstream, unchanged |
| react | `.tsx`/`.jsx`, components, hooks | Upstream, unchanged |
| web | `.tsx`, CSS, HTML | Upstream, unchanged |
| react-native | `apps/passenger`, `apps/driver`, `packages/ui` only | Paths narrowed from upstream so API and admin code do not get mobile guidance |

When updating from `~/Documents/agents-repo/ECC/rules`, re-apply the narrowed `paths:` block in `react-native/`.

Use these ECC agents and skills for Hopin work:

| Task | Agent or skill |
|---|---|
| Review TypeScript (API, shared packages) | `ecc:typescript-reviewer` |
| Review React / React Native / Next.js | `ecc:react-reviewer` |
| Schema, migrations, PostGIS queries | `ecc:database-reviewer`, skills `ecc:postgres-patterns`, `ecc:database-migrations` |
| Auth, payments, webhooks, uploads, trip-share tokens | `ecc:security-reviewer` |
| New feature or bug fix | `ecc:tdd-guide` |
| Maestro / Playwright end-to-end flows | `ecc:e2e-runner`, skill `ecc:e2e-testing` |
| Failing build | `ecc:build-error-resolver`, `ecc:react-build-resolver` |
| Accessibility of app and web UI | `ecc:a11y-architect`, skill `ecc:accessibility` |
| Implementation patterns | skills `ecc:nestjs-patterns`, `ecc:react-native-patterns`, `ecc:redis-patterns`, `ecc:api-design`, `ecc:docker-patterns`, `ecc:deployment-patterns` |

Not used here: native Swift/Kotlin reviewers (the apps are Expo), rule sets for other languages, `ecc:architecture-decision-records` (architect-base owns ADRs), and planner agents that write separate plan documents (the plan is `docs/hopin-plan.md`).
