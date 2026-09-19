# Data Architecture

Hopin is one system with one operator, so ownership is by store, not by team. The domain model is in [plan Part B4](../../hopin-plan.md#b4-domain-model-v1) until plan step S005 moves the ERD here. Classification and retention per data type are in [data-classification.md](../security/data-classification.md).

## Stores and systems of record

| Store | System of record for | Consistency | Backed up | Residency |
|---|---|---|---|---|
| Hopin Database (PostgreSQL + PostGIS) | Users, drivers, vehicles, rides, ride events, offers, payments, payouts, ratings, fare configs, service areas, trip shares, audit log | Transactional; ride events append-only | Yes ([backup-strategy.md](../reliability/backup-strategy.md)) | eu-central-1, copies eu-west-1 and Azure EU |
| Realtime Cache (Redis) | Nothing. Holds live positions, socket pub/sub and job queues | Best effort; rebuilt from live traffic | No, by design ([ADR 5](../decisions/0005-redis-socketio-realtime.md)) | eu-central-1 |
| Document Store (S3) | Driver documents | Versioned objects | Yes, plus Azure copy | eu-central-1, Azure EU |
| Identity (Cognito) | Login identities and group membership | Managed | Not exportable with credentials; phone sign-in re-enrols users | eu-central-1 |
| Stripe | Card tokens, charges, payouts | External | Stripe's responsibility; Hopin keeps references | Stripe EU entity (confirm in S041) |
| Invoicing provider (planned) | Hopin's fee invoices to drivers | External | Provider's responsibility | To be confirmed in S047 |

## Rules

- **One writer per fact.** The Hopin API is the only writer to the database. The backup exporter only reads.
- **Every partner-owned row has a tenant.** `tenant_id` plus row-level security on every partner-owned table; the Hopin brand is a tenant too ([ADR 9](../decisions/0009-hybrid-multi-tenancy.md), [QA-12](../requirements/quality-attributes.md)).
- **Controller roles follow the ride.** Partner rides have Hopin and the partner as joint controllers; accounts and Hopin-brand rides have Hopin alone ([ADR 11](../decisions/0011-joint-controllers-with-partners.md)).
- **Money and state move together.** A payment row changes only in the same transaction as the ride event that caused it; Stripe calls carry idempotency keys ([QA-09](../requirements/quality-attributes.md)).
- **Fares are reproducible.** A ride stores the fare-config version it was estimated with; fare configs are versioned by city and effective date ([C-03](../requirements/constraints.md)).
- **Location is minimised.** Live positions live in Redis; history is batched to PostgreSQL and aggregated after 90 days.
- **Deletion is pseudonymisation** where a legal retention duty applies.
