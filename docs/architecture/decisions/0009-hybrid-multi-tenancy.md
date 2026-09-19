# 9. Use a shared database with row-level security, with a dedicated database on demand

Date: 2026-09-19

## Status

Accepted

## Context

The [business case](../../business/business-case.md) makes Hopin a white-label dispatch platform: several licensed dispatch companies (partners) run on one Hopin system, and the Hopin consumer brand runs next to them. Each partner's drivers, rides, orders and payments must be invisible to every other partner. Hopin is run by one person ([P-01](../principles/architecture-principles.md)), and the first partners are expected to have 20–150 cars each.

## Decision drivers

- No partner can read another partner's data ([QA-12](../requirements/quality-attributes.md)).
- One operator must be able to migrate, back up and restore the system ([QA-04](../requirements/quality-attributes.md)).
- Cost per partner must stay small next to about 10,000 HUF per car per month ([QA-08](../requirements/quality-attributes.md)).
- A large partner may contractually require its own database.

## Considered options

1. Shared database, `tenant_id` on every partner-owned row, PostgreSQL row-level security (RLS).
2. A separate database per partner.
3. Hybrid: option 1 by default; a partner can be moved to a dedicated database with the same schema.

## Decision

We will use the hybrid. Every partner-owned table carries `tenant_id` and has an RLS policy. The API sets the tenant for each request inside its database transaction, and the application role cannot bypass RLS. The Hopin consumer brand is a tenant like any other.

A partner moves to a dedicated database only on contract request. The same schema and migrations run there, and the API routes that tenant's connections by configuration. The move path is built and tested when the first request arrives (plan step S119), not before.

## Consequences

Positive:

- One schema, one migration run and one backup plan for all partners by default.
- Isolation is enforced by the database, not only by application code.
- A partner's demand for its own database can be met without a redesign.

Negative / accepted trade-offs:

- A mistake in RLS policies or in setting the tenant can leak data across partners. Automated cross-tenant tests in CI are mandatory ([QA-12](../requirements/quality-attributes.md)).
- Restoring one partner from a shared backup means restoring to a scratch instance and copying that tenant's rows back.
- Each dedicated database adds about 60 EUR a month and its own migration run; its price must cover that.
- Connection routing by tenant adds a small layer the API must own from day one, even while every tenant uses the shared database.

## Risks

- Cross-tenant data leak through RLS mistakes, tracked as [RISK-015](../risks/architecture-risks.md).

## Related

- Requirements: [QA-12](../requirements/quality-attributes.md), [data architecture](../data/data-architecture.md).
- Other ADRs: [3. NestJS and PostgreSQL](0003-nestjs-postgresql-postgis.md), [10. One app for all partners](0010-one-app-for-all-partners.md), [11. Joint controllers](0011-joint-controllers-with-partners.md).
