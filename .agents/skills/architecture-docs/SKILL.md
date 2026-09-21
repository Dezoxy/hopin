---
name: architecture-docs
description: Create, review or maintain a repository's architecture knowledge base, including requirements, assumptions, ADRs, data and integration concerns, risks and transition plans. Use for docs/architecture work beyond diagrams; use architecture-views for Structurizr modelling and visual quality.
---

# Architecture documentation

Maintain a coherent explanation of what exists, why it exists, which constraints
it satisfies, what remains uncertain and how it may change. Work from repository
evidence and the user's stated intent. Follow the repo's paths, templates, pins
and checks. Do not implement product/infrastructure changes or add publishing,
export automation, dependencies or agent orchestration as a side effect.

## Route the work

- For an audit, inspect and report evidence-backed findings; edit only when the
  request authorizes fixes. For a maintenance request, update the affected records
  and links rather than rewriting the whole knowledge base.
- For a new knowledge base, establish a small entry point, relevant constraints,
  system explanation and links to important decisions. Add concern documents
  only when there is substantive content. No empty enterprise folder scaffold.
- For model/view changes, apply the companion `architecture-views` skill when
  available. It owns diagram semantics, audience views and visual verification;
  do not maintain a competing diagram standard here. If unavailable, preserve the
  existing diagram conventions and state that visual review was not performed.
- For a mixed request, assess evidence and requirements, update the affected model
  and records, then reconcile navigation and verify. Load only relevant material.

## Evidence before prose

1. Read the architecture entry point, relevant ADRs and instructions. Inventory
   existing documents and their canonical sources before proposing new paths.
2. Read the changed implementation/configuration and surrounding callers, routes,
   scheduled jobs, contracts, storage definitions and deployment files relevant
   to the claim. Refine searches using discovered terminology and explicit gaps;
   do not ingest a whole toolbox or assume an import graph is runtime architecture.
3. Separate **observed implementation**, **declared configuration**, **documented
   intent**, **proposal** and **unknown**. Local configuration does not prove live
   behavior. Link contradictions and resolve them with evidence; otherwise record
   the gap. Do not contact live systems just to make documentation look complete.
4. Read the staged and unstaged diff (or the requested comparison baseline), plus
   new files. Identify the claims that changed behavior would invalidate. Match
   the review breadth to the request; a small fix is not a whole-system audit.
5. Preserve project terminology and decisions. Technology examples and numerical
   targets in reference guides are not requirements for this repo.

## Keep each source authoritative

| Source | Owns |
|---|---|
| Architecture model | Elements, responsibilities, architectural relationships and deployment membership; views reuse these identities. |
| Written architecture | Scope, constraints, measurable quality requirements, assumptions, cross-cutting behavior, risks and evolution. |
| ADRs | Significant choices, actual decision drivers, considered alternatives and consequences. |
| API/schema/code/IaC | Exact interface and implementation contracts, resource settings and pins; architecture links to them. |
| Runbooks/alerts/dashboards | Execution and incident procedures, alert definitions and detailed operational configuration. |

Summarize only what explains a design or trade-off. Link full OpenAPI/event
schemas, Terraform settings, database definitions and commands; do not copy them
into architecture documents. One classification or risk register owns its facts;
other documents reference it. In a solo repo the same person may own every area;
do not invent teams to satisfy an ownership template.

## Entry point and concern coverage

Maintain `docs/architecture/README.md` (or the repo's equivalent) as the front
door: system/purpose/scope, audience reading paths, model/view register link,
key decisions, relevant concern documents, current/target state, known risks and
links to canonical implementation/runbooks. Keep the repo-wide docs index current.
Reuse the existing layout. The following are coverage prompts, not mandatory files:

| Area | Minimum useful content when applicable |
|---|---|
| Overview | Purpose, users, scope and exclusions, system boundaries, glossary for unfamiliar terms. |
| Principles | Principle, rationale, practical implication and relevant exception; no unsupported slogans such as "always use microservices". |
| Requirements | Constraints, quality scenarios, assumptions and traceable IDs for material requirements; distinguish targets from measurements. |
| Security | Trust boundaries, authentication, authorization, privileged access, secrets, exposure and sensitive-data handling; link implemented controls. |
| Data | Owner/system of record, lifecycle and retention, classification, residency, consistency/replication, important stores and permitted access. |
| Integration | Contract links, producers/consumers, sync/async behavior, authentication and failure handling. For events: delivery guarantee, ordering, retries, deduplication/idempotency and sensitive fields where known. |
| Deployment | Environments, locations, account/network boundaries, placement, scaling and shared failure domains; link IaC rather than enumerate every setting. |
| Reliability | Failure and customer impact, detection, degraded behavior, recovery, RPO/RTO scope, backup coverage and restore evidence; a successful backup is not a restore test. |
| Observability | Metrics/logs/traces/audit strategy, correlation, detection gaps, alert ownership and retention; link dashboards and alert definitions. |
| Risks/debt | Concrete risk, impact, likelihood basis, mitigation, residual risk, status, owner and review trigger; link the affected requirement/decision. |
| Roadmap | Current state, target rationale and staged transition: dependencies, outcome, validation/exit criterion, rollback or irreversibility, risk addressed and owner. Unknown dates remain unknown. |

Use compact records rather than filling every cell speculatively:

- **Quality scenario:** ID, source/stimulus, operating conditions, affected service
  or data, expected response, measurable target, validation method, current
  evidence and gap. An RTO alone does not imply that multi-region is necessary.
- **Assumption:** ID, claim, impact if false, affected decisions, owner and
  recheck date or event. If ownership/date is unset, say so.
- **Risk:** ID, failure/trigger, impact and likelihood evidence, mitigation,
  remaining exposure, owner/status and review trigger. Distinguish a known
  current limitation from a speculative future scaling concern.
- **Trade-off:** problem/requirement, viable alternatives including keeping the
  current design when relevant, benefits/costs, chosen option or proposal,
  consequences and conditions that would warrant reconsideration.

Link the chain where useful: requirement/constraint -> ADR -> model/view ->
implementation evidence -> validation or open risk. Small repositories can use
ordinary Markdown links and stable IDs; no traceability database is needed.

## ADR lifecycle and Structurizr compatibility

- Record significant boundary, persistence, integration, identity, hosting or
  operational choices. Formatting, routine pins and trivial implementation
  choices normally do not need ADRs. Reuse a relevant record rather than duplicate it.
- Use the repo's template and index. Describe only alternatives actually
  considered and rationale supported by the decision record/user. A historical
  decision with missing rationale says "not recorded"; do not invent a good reason.
- Default a new recommendation to **Proposed**. Use **Accepted** only when the
  decision is evidenced or the user adopts it. Accepted, implemented and deployed
  are different states; describe actual implementation status separately.
- Preserve decision history. A changed choice gets a new ADR with reciprocal
  supersedes/superseded-by links and a status update on the old record. Correct
  factual errors transparently; do not rewrite old reasoning as if it were current.
- With Structurizr's adr-tools importer, use `NNNN-short-title.md`, first line
  `# N. Title`, `Date: YYYY-MM-DD`, and `## Status` followed by the supported status.
  Put ADR relationship links inside Status before Context. Index records outside
  `decisions/`; keep templates in `templates/`. No README, template or stray
  Markdown belongs in the imported ADR directory. Confirm the target repo's
  importer before imposing this convention on a different repository.
- For a Structurizr layout, keep `workspace.dsl` at `docs/architecture/`, with
  `model/` include fragments. `!docs`/`!adrs` targets stay at or below the entry
  directory. Use a curated folder for the Documentation tab; do not assume it
  imports all nested concern folders. Preserve the target version's supported
  links and verify navigation/imports when changing them.
- **Title every document the Documentation tab imports with `##`, not `#`**,
  and use `###` for its subsections. Structurizr hides a level-1 heading: it
  appears neither in the rendered page nor in the navigation. The PDF builder
  normalises heading levels, so a `#`-titled document still looks right in
  print — the failure is invisible unless you look at the tab itself. The only
  `#` allowed is the workspace name as the first heading of the first document,
  which the PDF builder uses as its cover line. Symlinked registers are imported
  too, so the rule applies at their real path. Verify by opening the tab, not by
  reading the PDF.

## Maintenance and review

Review on a meaningful change, not by blindly refreshing dates:

- Interface/data-flow changes affect model, integration, security/data concerns
  and potentially ADRs.
- Hosting/identity/storage changes affect deployment, trust and failure domains,
  recovery and relevant runbook links.
- A changed target, invalidated assumption, incident or restore exercise affects
  requirements, risks, decision consequences and roadmap priorities.
- New paths/views/records require updated indexes and embedded references.

For each maintained document, use the repo's existing metadata convention. Record
an owner where known, meaningful review trigger, and evidence/revision for claims
likely to drift. A last-reviewed date means the content was checked; it is not
proof by itself. Never churn dates on untouched documents.

Review relevant boundaries, dependency failures, security, recovery, operability,
maintainability, scale and cost. Every reported defect must identify the source
claim/location, contradictory or missing evidence, concrete consequence and a
focused remedy. Separate unresolved questions from proven defects. Consolidate
duplicates, omit style preferences and accept zero findings. Scale review effort
to risk; no mandatory extra agents or generic enterprise patterns.

Run the repo's applicable documentation checks, links/index checks, ADR format
checks and model validation when affected. Use `docs-sync` before PR work if the
repo requires it. Check that referenced files/commands exist; do not execute
destructive runbook examples as verification. Preserve command exit status.
Report checks passed, failed and not run separately, plus changed docs and
remaining evidence gaps. Parser/links passing does not prove architecture claims.

## Reuse

Copy this directory into another repo's skill location and add an agent-instruction
pointer. Copy `architecture-views` too when diagram authoring is needed; each skill
can be used on its own. Discover that repo's sources and conventions rather than
copy homelab facts, the reference project's cloud stack or ECC's tool/model settings.
No dependency on ECC installation or the original guide is required at runtime.
