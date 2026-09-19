# Architecture Principles

Each principle has a rationale and an implication. A principle without an implication is a slogan. Hopin is built and run by one person, so several principles trade capability for operability on purpose.

## P-01 Boring, managed services first

- **Rationale:** One person cannot operate databases, queues and clusters and still ship a product.
- **Implication:** Use a managed AWS service unless an ADR explains why it does not fit. No self-hosted infrastructure in the live path ([ADR 4](../decisions/0004-ecs-fargate-for-api.md)).

## P-02 Everything as code, changed through pull requests

- **Rationale:** Environments must be reproducible after losing an account ([ADR 1](../decisions/0001-aws-primary-azure-for-off-provider-recovery.md)), and every change must be reviewable.
- **Implication:** Infrastructure is Terraform ([ADR 8](../decisions/0008-terraform-for-both-clouds.md)); `main` accepts changes only through merged pull requests. No console changes in staging or production.

## P-03 No long-lived credentials

- **Rationale:** Leaked static keys are the most common cloud breach for small teams.
- **Implication:** Humans use IAM Identity Center with MFA; CI uses OIDC; workloads use task roles. The single exception, the Azure upload credential, is write-only and tracked as [RISK-010](../risks/architecture-risks.md).

## P-04 Personal data stays in the EU

- **Rationale:** GDPR and user trust; location history is sensitive.
- **Implication:** All personal data at rest in EU regions ([QA-05](../requirements/quality-attributes.md)). Every processor needs a data processing agreement and an EU data location, or an ADR accepting the transfer.

## P-05 PostgreSQL is the system of record

- **Rationale:** Rides and money need transactional integrity; everything else can be rebuilt.
- **Implication:** Redis holds only data that live traffic rebuilds ([ADR 5](../decisions/0005-redis-socketio-realtime.md)). Every ride state change is an append-only ride event.

## P-06 Regulation is a requirement, not a later review

- **Rationale:** Hungarian taxi rules decide what the product may do ([S002 memo](../../compliance/s002-regulatory-memo.md)).
- **Implication:** Legal rules become constraints (`C-xx`) before design, and a feature that touches fares, dispatch or location data cites the constraint it satisfies.

## P-07 Observable before it is live

- **Rationale:** A solo operator learns about outages from alerts or from angry users.
- **Implication:** Nothing reaches production without structured logs, traces and the alerts in [observability-architecture.md](../observability/observability-architecture.md) ([QA-10](../requirements/quality-attributes.md)).

## P-08 Documentation is part of done

- **Rationale:** The plan and architecture are the product until code exists, and stale documents mislead.
- **Implication:** Every pull request runs the docs-sync audit and `scripts/check_docs_consistency.py` in CI.
