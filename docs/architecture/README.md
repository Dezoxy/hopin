# Architecture

## System

Hopin, a ride-hailing app for short city trips.

## Status

**Target architecture for the MVP. Nothing is built or deployed.** All content is documented intent from [the plan](../hopin-plan.md) and the ADRs below. When code and infrastructure exist, they become the evidence and these documents must be checked against them.

## Architecture model

- [workspace.dsl](workspace.dsl) is the entry point. Fragments live in [model/](model/).
- `make view` opens it at http://localhost:8080/workspace/1. `make check` validates and inspects it. `make export` renders every view into `generated/`, which is gitignored.
- [styles-shared.dsl](model/styles-shared.dsl) is copied unchanged from architect-base. Hopin's layer mapping is in [styles.dsl](model/styles.dsl).

## Reading paths

| Audience | Read in this order |
|---|---|
| Stakeholder | [Overview](overview/architecture-overview.md), Context, RideRequest, [risks](risks/architecture-risks.md), [transition plan](roadmap/transition-plan.md) |
| CTO / reviewer | Context, Security, ProductionCore, OffProviderRecovery, AwsBackups, [ADR 1](decisions/0001-aws-primary-azure-for-off-provider-recovery.md), [quality attributes](requirements/quality-attributes.md), [risks](risks/architecture-risks.md) |
| Engineer | Clients, Backend, Security, RideRequest, ProductionCore, all ADRs, [principles](principles/architecture-principles.md), [integration](integration/integration-architecture.md) |
| Operator | ProductionCore, AwsBackups, AzureRecovery, OffProviderRecovery, [availability](reliability/availability.md), [disaster recovery](reliability/disaster-recovery.md), [observability](observability/observability-architecture.md) |

## View register

Budgets come from the architecture-views skill. Visual check means the view was rendered with the pinned Structurizr image and inspected as a PNG on 2026-09-19.

| Key | Audience | Question | Scope and selection | Omitted on purpose | Update when | Visual check |
|---|---|---|---|---|---|---|
| Context | Everyone | Who uses Hopin and which outside services does it rely on? | System; three main user types and three external services | Trip-share viewer (see Clients); invoicing provider (not chosen) | Users or external services change | Passed |
| Clients | Engineer | Which apps exist, who uses each, and how do they reach the API? | Four people, four clients, the API | Sign-in to Identity (see Backend); Mapbox and Stripe calls from the passenger app (see Context) | A client or its API path changes | Passed |
| Backend | Engineer | What does the API depend on to do its work? | API, Identity, data stores, secrets, external services | Backup Exporter (see OffProviderRecovery); push delivery to devices | API dependencies change | Passed |
| Security | CTO, engineer | What is internet-facing, where do users authenticate, and where are secrets? | Three web and app clients, API, Identity, Secrets Store, database, Stripe | Driver app (same path as passenger app); Azure boundary (see OffProviderRecovery) | Exposure, identity or secret handling changes | Passed |
| OffProviderRecovery | CTO, operator | How do data and keys leave AWS so the service survives losing it? | Exporter, what it reads, Azure stores, operator restore | AWS Backup (see AwsBackups) | Backup chain or restore path changes | Passed |
| RideRequest | Stakeholder, engineer | What happens between requesting a ride and seeing a matched driver? | Eight numbered steps, happy path | Decline and timeout loop, payment failure, NO_DRIVER outcome | Matching or payment flow changes | Passed |
| ProductionCore | CTO, operator | Where does the live service run in AWS, and what fails together? | eu-central-1: load balancer, API tasks, database, cache, documents | Cognito, Secrets Manager, CDN and web hosting, client devices | Hosting, sizing or availability changes | Passed |
| AwsBackups | CTO, operator | Which AWS backups exist, and in which regions? | Backup vault, what it protects, cross-region copy | Off-provider chain (see AzureRecovery) | Backup plan changes | Passed |
| AzureRecovery | Operator | Where does the nightly off-provider copy run, and where do copies land? | Exporter task and the two Azure stores | Database and documents it reads (see ProductionCore) | Exporter placement or Azure layout changes | Passed |

Not modelled yet: CDN and web hosting, client devices, the CI/CD delivery path, observability, the BKK data feed and the taxi-meter integration. Add them when the matching plan steps start.

## Key decisions

- [0001 Use AWS as the primary cloud and Azure only for off-provider recovery](decisions/0001-aws-primary-azure-for-off-provider-recovery.md) (Accepted)
- [0002 Build the apps with Expo and the admin with a Next.js static export](decisions/0002-expo-for-mobile-apps-and-next-static-admin.md) (Accepted)
- [0003 Use NestJS with PostgreSQL and PostGIS](decisions/0003-nestjs-postgresql-postgis.md) (Accepted)
- [0004 Run the API on ECS Fargate](decisions/0004-ecs-fargate-for-api.md) (Proposed)
- [0005 Use Redis and Socket.IO for realtime](decisions/0005-redis-socketio-realtime.md) (Proposed)
- [0006 Use Amazon Cognito with SMS codes](decisions/0006-cognito-phone-otp.md) (Proposed)
- [0007 Use Stripe and Stripe Connect](decisions/0007-stripe-connect-payments.md) (Proposed)
- [0008 Manage infrastructure with Terraform](decisions/0008-terraform-for-both-clouds.md) (Proposed)

New ADR: copy [templates/adr.md](templates/adr.md) to `decisions/NNNN-short-title.md` and add it here. There is deliberately no README inside `decisions/`, because the ADR importer parses every `.md` file there.

## Written documentation

| Area | Documents |
|---|---|
| Overview | [architecture-overview](overview/architecture-overview.md) · [scope](overview/scope.md) · [glossary](overview/glossary.md) |
| Principles | [architecture-principles](principles/architecture-principles.md) · [engineering-standards](principles/engineering-standards.md) |
| Requirements | [constraints](requirements/constraints.md) · [quality-attributes](requirements/quality-attributes.md) · [assumptions](requirements/assumptions.md) |
| Security | [security-architecture](security/security-architecture.md) · [trust-boundaries](security/trust-boundaries.md) · [data-classification](security/data-classification.md) |
| Data | [data-architecture](data/data-architecture.md) |
| Integration | [integration-architecture](integration/integration-architecture.md) · [event-catalog](integration/event-catalog.md) |
| Deployment | [deployment-architecture](deployment/deployment-architecture.md) · [environments](deployment/environments.md) |
| Reliability | [availability](reliability/availability.md) · [backup-strategy](reliability/backup-strategy.md) · [disaster-recovery](reliability/disaster-recovery.md) |
| Observability | [observability-architecture](observability/observability-architecture.md) |
| Risks | [architecture-risks](risks/architecture-risks.md) |
| Roadmap | [current-state](roadmap/current-state.md) · [target-state](roadmap/target-state.md) · [transition-plan](roadmap/transition-plan.md) |

Only `overview/` is imported into the model by `!docs`. The rest is plain Markdown linked from here.

IDs are owned by one file each and cited everywhere else: `C-xx` constraints, `QA-xx` quality attributes, `A-xx` assumptions, `P-xx` principles, `RISK-xxx` risks. `scripts/check_docs_consistency.py` fails when a cited ID is not defined.

Deliberately absent: `data-ownership` (one operator owns every store; ownership is a column in data-architecture) and `technical-debt` (no code yet). Add them when they have content.

## Current and target architecture

[roadmap/current-state.md](roadmap/current-state.md) · [roadmap/target-state.md](roadmap/target-state.md) · [roadmap/transition-plan.md](roadmap/transition-plan.md)

## Known risks

[risks/architecture-risks.md](risks/architecture-risks.md)

## Not documented here

API contracts go in `/api`, Terraform in `/infra`, code in `/apps` and `/packages`, and runbooks in `docs/runbooks`. This folder links to them and does not copy them.
