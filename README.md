# Hopin — a reference architecture for regulated ride-hailing dispatch

*Hop in. Get there.*

**What this is:** an architecture case study. It designs a taxi dispatch platform for Hungary end to end, from statute text to deployment and disaster recovery, as a public portfolio of architecture work. **It is not a product and will not be operated.** Where the documents say "planned", read "designed, not built".

## The problem

A white-label dispatch platform for licensed Hungarian taxi companies, plus a consumer brand on the same platform: passenger app (iOS, Android, web), driver app, a dispatch console for partner staff, and a backend on AWS with recovery on Azure.

What makes it hard is not the stack. It is the constraints:

- **Law decides the product.** Only licensed taxis with certified meters may drive. The payable fare is the meter amount at fixed official rates, so no upfront prices, discounts or surge. A Budapest dispatch operator needs 100 M HUF equity and BKK-certified software. See the [regulatory memo](docs/compliance/s002-regulatory-memo.md) and [constraints C-01 to C-09](docs/architecture/requirements/constraints.md).
- **Several companies share one system.** Partners must never see each other's data, yet share one app ([ADR 9](docs/architecture/decisions/0009-hybrid-multi-tenancy.md), [ADR 10](docs/architecture/decisions/0010-one-app-for-all-partners.md)).
- **Personal location data** under GDPR, with controller roles that depend on who holds the dispatch licence ([ADR 11](docs/architecture/decisions/0011-joint-controllers-with-partners.md)).
- **One operator.** Every design choice has to be runnable by a single person ([P-01](docs/architecture/principles/architecture-principles.md)).

## Decisions worth reading

| Decision | The reusable rule it sets |
|---|---|
| [ADR 1: AWS primary, Azure only for recovery](docs/architecture/decisions/0001-aws-primary-azure-for-off-provider-recovery.md) | Use a second cloud for the failure you actually fear (losing the account), not for symmetry |
| [ADR 9: shared database with row-level security, dedicated on demand](docs/architecture/decisions/0009-hybrid-multi-tenancy.md) | Isolation is enforced by the database; a silo is sold, not defaulted |
| [ADR 10: one app, one partner per order](docs/architecture/decisions/0010-one-app-for-all-partners.md) | Never let the platform become the licensed party by accident |
| [ADR 11: joint controllers, pending legal review](docs/architecture/decisions/0011-joint-controllers-with-partners.md) | Controller roles follow the law, not the contract; leave it Proposed until counsel confirms |
| [ADR 12: payment capture as a workflow named by the ride](docs/architecture/decisions/0012-payment-capture-workflow.md) | Exactly-once effect comes from idempotency, not the network: name the workflow after the thing it must not do twice |

All twelve ADRs, 25 model views and the reading paths per audience are in the [architecture README](docs/architecture/README.md). To present them, use the [talk tracks](docs/architecture/talks/talk-tracks.md) and the per-view [speaker notes](docs/architecture/talks/speaker-notes.md).

## Read by audience

- **Executive:** [business case](docs/business/business-case.md), the Context view, the [risk register](docs/architecture/risks/architecture-risks.md).
- **Architect or CTO:** [quality attributes](docs/architecture/requirements/quality-attributes.md), [constraints](docs/architecture/requirements/constraints.md), the ADRs, the Security and deployment views.
- **Engineer:** the [architecture README](docs/architecture/README.md) engineer path, [integration](docs/architecture/integration/integration-architecture.md) and the [event catalog](docs/architecture/integration/event-catalog.md).
- **Operator:** [availability](docs/architecture/reliability/availability.md), [disaster recovery](docs/architecture/reliability/disaster-recovery.md), [observability](docs/architecture/observability/observability-architecture.md).

## Status and what comes next

The design is complete for the MVP scope. The build roadmap in the [plan](docs/hopin-plan.md) is frozen. Active work is the portfolio track, plan Phase 12:

- STRIDE threat model on the Security view
- Three-year cost model
- One-page executive summary
- A thin, running slice with a load test, so at least one quality attribute is measured, not only targeted
- A written or spoken walkthrough of the key decisions

## Repository layout

```text
.agents/skills/     agent skills (mirror of .claude/skills)
.claude/            Claude Code skills and ECC language rules
.github/workflows/  docs consistency and architecture PDF workflows
docs/               plan, architecture knowledge base, business case, compliance research
scripts/            docs consistency check, architecture PDF tooling
AGENTS.md           agent instructions (identical to CLAUDE.md)
CLAUDE.md           agent instructions
Makefile            architecture model and docs commands (`make` lists them)
```

## Checks

```bash
make docs     # documentation consistency
make check    # Structurizr model validate + inspect (needs Docker)
```

Both run in CI on every pull request, alongside Markdown lint and secret scanning. `main` accepts changes only through pull requests.
