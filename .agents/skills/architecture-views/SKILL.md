---
name: architecture-views
description: Author, review or fix C4 diagrams as Structurizr models and audience-specific views (workspace.dsl, views.dsl) from repository evidence, with automatic layout and no manual diagram finishing. Use when a diagram or view looks wrong, is missing or needs a new audience, and for architecture modelling and presentation readiness; not for export automation or infrastructure deployment.
---

# Architecture views

Create a coherent architecture that a stakeholder, CTO, engineer or operator can
understand through an appropriate reading path in Structurizr. The deliverable is
the model and its views, ready to browse and manually export as PNG/SVG. Do not
add an export pipeline, documentation site, renderer migration or deployment
unless requested. Follow the target repo's instructions and verification rules.

The authoring agent chooses the views using this standard; Structurizr parses
the DSL and lays them out. It does not infer audiences, business intent or good
view boundaries. Never promise that metadata alone guarantees a clean diagram.

A communication diagram, such as a Figma drawing for a deck or a Mermaid block
pasted into a document, is derived from one accepted view for one audience. It
keeps the view's names, icons and colour meanings, records its source view key
and the model commit it was traced from, and is not a view: it never feeds back
into the model, and it is stale once its source view's update trigger fires.

For a broader architecture knowledge-base request, use the companion
`architecture-docs` skill when available: it owns requirements, ADR lifecycle,
risk/roadmap records and documentation maintenance. This skill owns the model,
view register and rendered readability. A diagram-only change does not require
a knowledge-base overhaul; update only the prose it makes inaccurate.

## Establish the evidence and the questions

1. Read the existing architecture, decisions, application entry points and
   deployment configuration. Determine what the software provides and who uses
   it before treating hosts or directories as architectural boundaries.
2. Record which claims come from code/configuration, which are documented intent,
   and which are unknown. Repository configuration is declared state, not proof
   of deployed state. Do not contact live infrastructure just to author diagrams.
   Trace important interactions from entry point through handler/job, storage or
   external client to deployment configuration. Search using the repo's own names,
   then narrow searches to missing evidence; directory names alone are not proof
   of runtime connections. Reconcile contradictions instead of picking the most
   convenient source. Unresolved contradictions remain explicit gaps.
3. Review existing views against the catalogue below. Preserve useful stable
   keys and embedded-view references. Propose keep/split/merge/drop with a reason;
   do not create every possible diagram regardless of relevance.
4. In the architecture README, maintain a view register with: key, audience,
   question, scope/abstraction, selection rule, omitted concerns, source evidence,
   update trigger and visual verification status. Register intentional omissions
   too, so a focused view is not mistaken for the entire system.

## One model, appropriate abstractions

- Model people, software systems, applications/data stores, their relationships
  and deployment separately. A C4 container is an application or data store,
  not necessarily a Docker container, VM, repository or business capability.
- Keep one identity per real architectural element. Reuse it in multiple views;
  do not invent executive copies with conflicting names or relationships.
- Give elements a meaningful name and concise responsibility; include technology
  for containers and deployment nodes. Keep configuration detail in properties
  or linked docs rather than multi-paragraph box labels.
- Use capability/domain tags for selection. Use properties and perspectives for
  trust zone, authentication, data classification/residency, failure domain and
  recovery objectives where relevant. An unknown value stays explicitly unknown.
  Distinguish a recovery target from a measured result; link evidence and ADRs.
- Relationships say what happens in the arrow's direction (verb plus object),
  with protocol/technology where useful. Distinguish a request from returned data;
  do not reverse an arrow merely to improve layout. Do not invent direct paths
  to hide intermediaries. Use system-level relationships for a higher abstraction.
- Keep purpose and protocol in separate DSL fields: for example, description
  "Publishes payment outcomes" and technology "AMQP". Where the concern needs it,
  record synchronous/asynchronous interaction, authentication, data class,
  criticality and trust crossing as properties/tags; display only the relevant
  subset. Avoid labels such as "uses", "API" or "connects to" without intent.
- Technical deployment views identify environment and location, actual instance
  counts and stateful dependencies where evidenced. Replicas are not proof of HA:
  show shared host/storage/site failure domains. A security view distinguishes
  authentication from authorization and includes privileged access when in scope.
- Keep rationale, alternatives, risks and recovery procedures in docs/ADRs.
  Link from the relevant model element/view. Do not duplicate risk registers in
  DSL descriptions or fabricate RPO/RTO, ownership or business outcomes from code.
- Separate current and proposed architecture with explicit environments/tags
  and titles. A roadmap must never look like already deployed capability.

## View catalogue and audience reading paths

Choose the applicable families; each row can produce several focused views.
Use C4 structure/runtime/deployment notation and arc42's concern coverage without
requiring an entire framework. A small repo may need only context, containers and
one deployment view, with the remaining concerns explained in documentation.

| Family | Question and scope | Audience | Selection and update trigger |
|---|---|---|---|
| Purpose/context | What does the system provide, who uses it, and which external systems matter? System level, plain-language relationships. | Everyone | Users + system + relevant direct external relationships; change when users, scope or dependencies change. Separate runtime context from delivery tooling. |
| Containers by capability | How are responsibilities implemented and connected? Applications and stores, with external context. | Engineers, architects | Capability tag + necessary neighbours + explicit relationships; change when implementation boundaries or interfaces change. |
| Key runtime scenarios | How does one important request or event proceed? One abstraction level, numbered interactions. | Stakeholders or engineers, depending on scenario | Ordered instances of model relationships; change when behavior, ordering, failure handling or authentication changes. Avoid a diagram for every trivial call. |
| Deployment overview | Where does the system run and what infrastructure does it share? Sites/hosts/system instances. | CTO, architects | One environment, high-level placement and failure domains; change with hosting, site or availability changes. |
| Deployment detail | Which runtime hosts each application/store? | Engineers, operators | One capability or bounded group of guests, their application instances and necessary infrastructure; change with placement. Configuration inventories stay in tables/docs. |
| Access/security | How does one entry path cross trust boundaries, and where is authentication enforced? | CTO, engineers | One access scenario and its trust boundaries; change with exposure, identity or network policy. Separate public, internal and administration paths. |
| Data | What is stored or exchanged, how sensitive is it and where does it reside? | CTO, engineers | One data domain's stores or external processing chain; change with classification, recipient, storage or residency. Separate storage from outbound processing if crowded. |
| Reliability/recovery | What fails together, what detects it, and how is service/data recovered? | CTO, operators | One failure scenario or backup/restore chain with linked objectives/evidence; change with redundancy, backup, restore or recovery targets. |
| Delivery | How does a change reach the system? | Engineers, operators | One deployment scenario including identity and state dependencies; change with release/deploy procedure. |
| Observability | How does a failure become an actionable signal? | Engineers, operators | One telemetry/alerting path and its monitoring dependencies; change with coverage or notification paths. Do not connect every monitored host to one unreadable hub. |
| Integration (when needed) | Which contracts connect independently evolving systems, and what delivery behavior do consumers rely on? | Engineers, architects | One interface/event family, producers and consumers; change with contract or delivery semantics. Link schemas, retries, ordering and idempotency detail rather than fitting them all on arrows. |
| Component (when needed) | Which internal responsibilities explain a complex application boundary? | Engineers | One container's meaningful components; change with internal design. Do not diagram every class or infer components from folders alone. |
| Network (when needed) | Which connectivity or isolation constraint needs explanation beyond the deployment/access views? | Platform engineers, operators | One network concern and relevant zones/routes; change with routing or isolation. Omit if existing views already answer it. |
| Current/target transition (when needed) | What structural change addresses the stated requirement or risk? | CTO, architects | Comparable current/proposed scopes and a link to transition steps; change with an approved direction or newly discovered constraint. Never imply a proposal is live. |
| Risk/roadmap summary | What limitations matter and which decision comes next? | Stakeholders, CTO | Short documentation/table linked to current/proposed views and ADRs; change with risk, decision or investment priorities. Do not force it into a graph. |

The C4 levels (context, containers, components) are one axis: what is inside.
Runtime scenarios, deployment and concern views are the other axes. A reading
path is chosen by audience and question and cuts across all of them; it is not
a descent through the levels, and a non-technical audience rarely zooms at all.
A risk or roadmap summary is a table, not a diagram. The register, not the
level structure, records which view answers which question for whom.

Provide navigation in the architecture README and, where supported, Structurizr's
Documentation tab. Reuse views between reading paths:

- **Stakeholder (non-technical, such as a CEO):** purpose/context, one
  representative journey, hosting overview, short risk/roadmap summary. Explain
  value and limitations without host IDs or IPs.
- **CTO:** context, deployment/failure overview, relevant data/security views,
  recovery objectives and risk/decision summary. Make trade-offs explicit.
- **Engineer:** context, capability containers, relevant runtime flows,
  deployment detail and associated ADRs.
- **Operator:** placement, access, delivery, observability and recovery scenarios,
  linked to the actual runbooks.

Audience selection is not access control. Check labels and linked content before
calling a view suitable for broad circulation. A filtered view does not redact
the underlying workspace. Never put credentials or personal records in it.

## Automatic layout and notation

- Every new or redesigned diagram uses `autoLayout`. No dragging, saved manual
  coordinates, bend points, hidden spacer elements or post-export retouching.
  Ordinary text-based direction, grouping and include/exclude rules are allowed.
- Prefer explicit, focused base views. Structurizr filtered views select by tags;
  they are not semantic aggregation or a cure for an overloaded base layout.
- Use top-to-bottom as a starting point for fan-out and left-to-right for chains.
  These are starting heuristics, not readability guarantees. Use few nesting
  levels and include boundaries only when they communicate ownership or trust.
- Select relationships for the question. Do not automatically draw every edge
  between included nodes. Keep omitted essential information in a named companion
  view; simplifying must not hide a material dependency or failure mode.
- Start with budgets of **7 elements/8 arrows** for an audience overview,
  **10/12** for a technical structural view, **7 participants/8 interactions**
  for a runtime scenario, and **12 visible boxes/8 arrows** for deployment.
  Count deployment/group boundary boxes too. These are provisional authoring
  budgets, not C4 rules or measured renderer limits. Split at the budget; do not
  enlarge it without rendered evidence recorded in the view register.
- If unreadable below budget, split earlier: by capability for structure, by
  scenario for runtime/access, by site/host/capability for deployment, and by data
  domain for data. Give each resulting view its own question and navigation link.
- Titles identify system, concern and scope. Every standalone view must have a
  meaningful key/legend. Verify how the installed Structurizr version exports its
  key: if separate, identify the matching key rather than claiming it is embedded.
- Use name + type + short responsibility, with technology at technical levels.
  Explain unfamiliar acronyms; stakeholder views avoid implementation jargon.
- Label unidirectional arrows with intent. Opposing interactions may be separate
  labelled arrows when necessary; never use one ambiguous double-headed arrow.
- Keep shape/colour/border meanings consistent and explain them in the key.
  Colour must not be the only signal. Icons supplement names. Prefer a small
  semantic legend over a wall of branding combinations. Reserve red for one
  explicit warning/security meaning, never a normal capability category.

## Validate the actual result

Before rendering, review the affected relationships and boundaries against their
source context. For each material gap, name the model/view, supporting file and
the concrete consequence (for example, an omitted shared disk hides a common
failure). Prioritize broken contracts and misleading claims over stylistic
preferences. Mark uncertainty as a question, not a proven defect; zero findings
is a valid result. This is a review pass, not a requirement to spawn other agents.

1. Use the repo's pinned Structurizr parser to validate and inspect. Follow local
   checks; do not invent a second tool-version policy. Inspect already detects
   missing descriptions/technology, disconnected or unviewed elements and other
   model issues; it does not prove visual clarity or audience suitability.
2. Preview each changed view in Structurizr or its same-version native renderer.
   A temporary local rendering for review is fine; it is not an export pipeline.
   Check at the intended reading size, not only while zoomed far in: readable
   labels, no overlapping text, no arrows through unrelated boxes, traceable
   directions, clear boundaries, and a useful legend.
3. On failure, simplify or split the source view and inspect again. Do not repair
   coordinates. If native automatic rendering still fails, report that limitation
   and offer a simpler representation in the Documentation tab. Do not silently
   switch renderers or claim Structurizr can guarantee presentation quality.
4. Report separately: evidence/model checks, parser/inspection checks, and visual
   checks. If preview is unavailable, mark the view **not visually verified**.
   A valid DSL is not a presentation-ready result.
   Review the final diff for unintended changes. Record which views were checked
   and what remains unverified; do not use a timestamp or parser success as a
   substitute for evidence that a diagram communicates the intended question.

## Adoption and growth

Copy this skill directory into another repo's agent skill location and add a
repo-instruction pointer to use it for architecture work. If the repo supports
multiple agent directories, follow its mirroring convention. Discover the new
repo's architecture paths, evidence sources and tool pins; no homelab-specific
hosts, names or business domains belong in this skill.

When a new application, host, capability or site appears, update its facts once
in the model, review the affected catalogue entries and reading paths, and split
views at their scope budget. A new host changes placement, not automatically the
stakeholder context. A new capability needs focused views only when it introduces
a distinct responsibility or concern. Changes need model/view authoring judgment;
neither arbitrary repo changes nor skill installation automatically generate DSL.

During adoption, identify legacy manual views explicitly. Do not silently discard
their layouts or break embedded references. Convert only the views in the agreed
scope. Remove old coordinate artifacts/checks when no remaining view relies on
them, following the repo's change workflow.

## Basis

- [C4 context](https://c4model.com/diagrams/system-context),
  [containers](https://c4model.com/diagrams/container),
  [dynamic](https://c4model.com/diagrams/dynamic),
  [deployment](https://c4model.com/diagrams/deployment) and
  [diagram checklist](https://c4model.com/diagrams/checklist).
- [arc42 concern coverage](https://arc42.org/overview/).
- [Architectural viewpoints](https://www.viewpoints-and-perspectives.info/home/viewpoints/).
- [Structurizr filtered views](https://docs.structurizr.com/dsl/cookbook/filtered-view/)
  and [inspections](https://docs.structurizr.com/workspaces/inspections).
