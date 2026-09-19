# Architecture

## System

Hopin, a ride-hailing app for short city trips.

## Status

**Reference architecture for a portfolio case study. It will not be built or operated as a product.** Nothing is deployed; a thin running slice ([slice/](../../slice/README.md)) provides the first local measurements. All content is documented intent from [the plan](../hopin-plan.md) and the ADRs below. When code and infrastructure exist, they become the evidence and these documents must be checked against them.

## Architecture model

- [workspace.dsl](workspace.dsl) is the entry point. Fragments live in [model/](model/).
- `make view` opens it at <http://localhost:8080/workspace/1>. `make check` validates and inspects it. `make export` renders every view into `generated/`, which is gitignored.
- [styles-shared.dsl](model/styles-shared.dsl) is copied unchanged from architect-base. Hopin's layer mapping is in [styles.dsl](model/styles.dsl).

## Reading paths

| Audience | Read in this order |
|---|---|
| Stakeholder | [Executive summary](../executive-summary.md), [Overview](overview/architecture-overview.md), Context, RideRequest, Authorities, DriverAlarm, [risks](risks/architecture-risks.md), [transition plan](roadmap/transition-plan.md) |
| CTO / reviewer | Context, Security, PartnerIsolation, LocationData, ProductionCore, OffProviderRecovery, AccountRecovery, [ADR 1](decisions/0001-aws-primary-azure-for-off-provider-recovery.md), [quality attributes](requirements/quality-attributes.md), [risks](risks/architecture-risks.md) |
| Engineer | Clients, Backend, ApiRideFlow, ApiPayments, PaymentCapture, Security, RideRequest, ProductionCore, Delivery, all ADRs, [principles](principles/architecture-principles.md), [integration](integration/integration-architecture.md) |
| Operator | ProductionCore, AlertPath, DriverAlarm, RedisLost, AwsBackups, AzureRecovery, OffProviderRecovery, RegionRecovery, AccountRecovery, [availability](reliability/availability.md), [disaster recovery](reliability/disaster-recovery.md), [observability](observability/observability-architecture.md) |

## View register

Budgets come from the architecture-views skill. Visual check means the view was rendered with the pinned Structurizr image and inspected as a PNG on 2026-09-19.

| Key | Audience | Question | Scope and selection | Omitted on purpose | Update when | Visual check |
|---|---|---|---|---|---|---|
| Context | Everyone | Who uses Hopin and which outside services does it rely on? | System; three main user types and three external services | Trip-share viewer and partner dispatcher (see Clients); invoicing provider (not chosen) | Users or external services change | Passed |
| Clients | Engineer | Which apps exist, who uses each, and how do they reach the API? | Five people, four clients, the API | Sign-in to Identity (see Backend); Mapbox and Stripe calls from the passenger app (see Context) | A client or its API path changes | Passed |
| Backend | Engineer | What does the API depend on to do its work? | API, Identity, data stores, secrets, external services | Backup Exporter (see OffProviderRecovery); push delivery to devices | API dependencies change | Passed |
| Security | CTO, engineer | What is internet-facing, where do users authenticate, and where are secrets? | Three web and app clients, API, Identity, Secrets Store, database, Stripe | Driver app (same path as passenger app); Azure boundary (see OffProviderRecovery) | Exposure, identity or secret handling changes | Passed |
| OffProviderRecovery | CTO, operator | How do data and keys leave AWS so the service survives losing it? | Exporter, what it reads, Azure stores, operator restore | AWS Backup (see AwsBackups) | Backup chain or restore path changes | Passed |
| RideRequest | Stakeholder, engineer | What happens between requesting a ride and seeing a matched driver? | Eight numbered steps, happy path | Decline and timeout loop, payment failure, NO_DRIVER outcome | Matching or payment flow changes | Passed |
| ProductionCore | CTO, operator | Where does the live service run in AWS, and what fails together? | eu-central-1: load balancer, API tasks, database, cache, documents | Cognito, Secrets Manager, CDN and web hosting, client devices | Hosting, sizing or availability changes | Passed |
| AwsBackups | CTO, operator | Which AWS backups exist, and in which regions? | Backup vault, what it protects, cross-region copy | Off-provider chain (see AzureRecovery) | Backup plan changes | Passed |
| AzureRecovery | Operator | Where does the nightly off-provider copy run, and where do copies land? | Exporter task and the two Azure stores | Database and documents it reads (see ProductionCore) | Exporter placement or Azure layout changes | Passed |
| ApiRideFlow | Engineer | Which components carry a ride from estimate to live tracking? | Two apps, four API components, database, cache | Mapbox (see Backend); tenancy (see PartnerConsole) | Ride flow components change | Passed |
| ApiPayments | Engineer, CTO | Which parts move money, and how do they avoid charging twice? | Payments, webhooks, outbox, Payment Workflow, Stripe, database | Ride Lifecycle (step 1 of PaymentCapture); regulatory adapters (see ApiRegulatoryFeeds) | Payment flow changes ([ADR 12](decisions/0012-payment-capture-workflow.md)) | Passed; a few crossings, labels readable |
| ApiRegulatoryFeeds | Engineer | How do committed changes reach BKK and the invoicing provider? | Outbox, regulatory adapters, database, cache, BKK, invoicing provider | NAV and the taxi meter (see Authorities) | Regulatory interfaces decided (S047, S112) | Passed after switching to top-to-bottom; labels on the API border stay readable |
| PartnerConsole | Engineer, CTO | How does a partner's console reach its data, and only its data? | Admin Web, dispatch, tenancy, rides, realtime, Identity, database | Operator paths | Tenancy or console changes | Passed |
| PartnerIsolation | CTO, engineer | How is a partner request kept inside that partner's data? | Five numbered steps | Writes; consumer brand requests | Tenancy mechanism changes ([ADR 9](decisions/0009-hybrid-multi-tenancy.md)) | Passed |
| PaymentCapture | Engineer, CTO | How is the meter amount captured exactly once? | Seven steps from completion to the resumed workflow | Meter above the hold (second charge inside the workflow); Azure fallback ([ADR 12](decisions/0012-payment-capture-workflow.md)) | Capture flow changes | Passed |
| PaymentCaptureDeclined | Engineer | What happens when the capture is declined? | Six steps to FAILED and a blocked account | Partner loss cap (a contract term in ADR 12) | Retry or failure policy changes | Passed |
| DriverAlarm | Stakeholder, operator | What happens when a driver presses the alarm? | Six steps from alarm to partner dispatcher and operator page | The 112 call itself | Alarm handling changes ([C-06](requirements/constraints.md)) | Passed |
| TripShare | Stakeholder, engineer | How does someone without an account follow a shared ride? | Five steps | Revocation | Share flow or token rules change | Passed |
| PhoneOrder | Stakeholder, operator | How does a phone order become a ride? | Six steps | Caller call-back details | Dispatch console changes | Passed |
| RedisLost | CTO, operator | What happens when the Redis node is lost? | Five steps, degraded then recovered | Socket reconnect storms | Redis role changes ([RISK-008](risks/architecture-risks.md)) | Passed |
| LocationData | CTO, DPO | Where does personal location data go, and where does it leave the system? | Clients, API, stores, BKK, backup path | Retention periods (see data classification) | Location processing or recipients change ([C-09](requirements/constraints.md)) | Passed |
| AlertPath | Operator | How does a failure become a page to the operator? | API, exporter, Monitoring, app crash reporting, operator | Individual alarm thresholds (see observability) | Alerting changes | Passed after switching to top-to-bottom |
| Authorities | Stakeholder, CTO | Which authorities and regulated devices touch the system, and how? | API, driver app, taxi meter, BKK, invoicing provider, NAV | Stripe, identity | Regulatory interfaces decided (S047, S112, S113) | Passed |
| Delivery | Engineer, operator | How does a change reach production, and with which identity? | GitHub Actions, image registry, Terraform state, API tasks | Staging and dev; mobile builds (EAS) | Pipeline or deploy identity changes | Passed |
| RegionRecovery | CTO, operator | What runs in eu-west-1 after eu-central-1 is lost? | Recovery environment for the region scenario | Documents bucket; DNS switch | DR design changes | Passed |
| AccountRecovery | CTO, operator | What runs on Azure after the AWS account is lost, and what is missing? | Recovery environment for the account scenario, including the identity gap | DNS; third-party key rotation | DR design changes ([RISK-017](risks/architecture-risks.md)) | Passed |

Not modelled yet: CDN and web hosting, client devices, and mobile app delivery through EAS. The BKK feed, taxi meter and invoicing provider are modelled with their interfaces marked not yet known.

Speaker notes for every view are in [talks/speaker-notes.md](talks/speaker-notes.md); the talk tracks are in [talks/talk-tracks.md](talks/talk-tracks.md).

## Key decisions

- [0001 Use AWS as the primary cloud and Azure only for off-provider recovery](decisions/0001-aws-primary-azure-for-off-provider-recovery.md) (Accepted)
- [0002 Build the apps with Expo and the admin with a Next.js static export](decisions/0002-expo-for-mobile-apps-and-next-static-admin.md) (Accepted)
- [0003 Use NestJS with PostgreSQL and PostGIS](decisions/0003-nestjs-postgresql-postgis.md) (Accepted)
- [0004 Run the API on ECS Fargate](decisions/0004-ecs-fargate-for-api.md) (Proposed)
- [0005 Use Redis and Socket.IO for realtime](decisions/0005-redis-socketio-realtime.md) (Proposed)
- [0006 Use Amazon Cognito with SMS codes](decisions/0006-cognito-phone-otp.md) (Proposed)
- [0007 Use Stripe and Stripe Connect](decisions/0007-stripe-connect-payments.md) (Proposed)
- [0008 Manage infrastructure with Terraform](decisions/0008-terraform-for-both-clouds.md) (Proposed)
- [0009 Use a shared database with row-level security, with a dedicated database on demand](decisions/0009-hybrid-multi-tenancy.md) (Accepted)
- [0010 Ship one passenger app and one driver app for all partners](decisions/0010-one-app-for-all-partners.md) (Accepted)
- [0011 Hopin and each partner are joint controllers for partner rides](decisions/0011-joint-controllers-with-partners.md) (Proposed, pending lawyer)
- [0012 Capture the meter amount with an outbox-started Step Functions workflow](decisions/0012-payment-capture-workflow.md) (Accepted)
- [0013 The operator reads partner data only through time-boxed partner grants](decisions/0013-operator-access-by-partner-grant.md) (Accepted)

New ADR: copy [templates/adr.md](templates/adr.md) to `decisions/NNNN-short-title.md` and add it here. There is deliberately no README inside `decisions/`, because the ADR importer parses every `.md` file there.

## Written documentation

| Area | Documents |
|---|---|
| Overview | [architecture-overview](overview/architecture-overview.md) · [scope](overview/scope.md) · [glossary](overview/glossary.md) |
| Principles | [architecture-principles](principles/architecture-principles.md) · [engineering-standards](principles/engineering-standards.md) |
| Requirements | [constraints](requirements/constraints.md) · [quality-attributes](requirements/quality-attributes.md) · [assumptions](requirements/assumptions.md) |
| Security | [security-architecture](security/security-architecture.md) · [trust-boundaries](security/trust-boundaries.md) · [threat-model](security/threat-model.md) · [data-classification](security/data-classification.md) |
| Data | [data-architecture](data/data-architecture.md) |
| Integration | [integration-architecture](integration/integration-architecture.md) · [event-catalog](integration/event-catalog.md) |
| Deployment | [deployment-architecture](deployment/deployment-architecture.md) · [environments](deployment/environments.md) |
| Reliability | [availability](reliability/availability.md) · [backup-strategy](reliability/backup-strategy.md) · [disaster-recovery](reliability/disaster-recovery.md) |
| Observability | [observability-architecture](observability/observability-architecture.md) |
| Risks | [architecture-risks](risks/architecture-risks.md) |
| Evidence | [s123-slice-results](evidence/s123-slice-results.md): first measurements from the thin slice |
| Roadmap | [current-state](roadmap/current-state.md) · [target-state](roadmap/target-state.md) · [transition-plan](roadmap/transition-plan.md) |

Only `overview/` is imported into the model by `!docs`. The rest is plain Markdown linked from here.

IDs are owned by one file each and cited everywhere else: `C-xx` constraints, `QA-xx` quality attributes, `A-xx` assumptions, `P-xx` principles, `RISK-xxx` risks, `T-xx` threats. `scripts/check_docs_consistency.py` fails when a cited ID is not defined.

Deliberately absent: `data-ownership` (one operator owns every store; ownership is a column in data-architecture) and `technical-debt` (no code yet). Add them when they have content.

## Current and target architecture

[roadmap/current-state.md](roadmap/current-state.md) · [roadmap/target-state.md](roadmap/target-state.md) · [roadmap/transition-plan.md](roadmap/transition-plan.md)

## Known risks

[risks/architecture-risks.md](risks/architecture-risks.md)

## Not documented here

API contracts go in `/api`, Terraform in `/infra`, code in `/apps` and `/packages`, and runbooks in `docs/runbooks`. This folder links to them and does not copy them.
