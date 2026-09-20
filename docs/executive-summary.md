# Hopin — Executive Summary

> One-page decision memo, 2026-09-19. Part of a reference architecture case
  study: written as the owner of Hopin would receive it. All figures link to
  their source; costs are estimates, not quotes.

## The decision

**Approve building Hopin as a white-label dispatch platform for licensed
Hungarian taxi companies, with the Hopin consumer brand second,** subject to
three gates listed at the end.

## Why this, and why now

- **The law closed the obvious path.** Running Hopin as its own Budapest
  dispatch service needs 100 M HUF of equity and BKK-certified software; only
  the meter amount may be charged, at fixed official rates ([regulatory
  memo](compliance/s002-regulatory-memo.md)).
- **The same law opened a market.** Since 1 July 2026 every Budapest dispatch
  company must offer passengers a certified app with a fare check
  ([C-06](architecture/requirements/constraints.md)). Most small companies
  cannot build one. Hopin is designed to that specification.
- **Price alone does not beat Bolt.** A lower commission can be matched in a
  day. Partners with licences, drivers and passengers are the moat ([business
  case](business/business-case.md)).

## What it costs and returns

Three-year view in million HUF ([cost model](business/three-year-cost-model.md)):

| Scenario | Year 3 revenue | Year 3 cash costs | Three-year result after paying the founder a market salary |
|---|---|---|---|
| Ambitious (plan): 20 partners, 1,000 cars | 195.1 | 87.5 | +81.7 |
| Base: 10 partners, 500 cars | 94.6 | 49.6 | −1.5 |
| Conservative: 6 partners, 300 cars | 34.5 | 19.1 | −59.6 |

- Year 1 needs about 15.7 M HUF once the founder's time is counted.
- People are almost 60 % of cost; cloud is small. The largest technology cost is
  the routing API that legally required road-distance matching uses
  ([RISK-019](architecture/risks/architecture-risks.md)); it has a planned lever
  before it matters.

## How the design protects the business

- **Partners' data stays theirs.** One shared platform, but the database itself
  separates partners, and the operator sees a partner's data only under a
  time-boxed grant from that partner ([ADR
  9](architecture/decisions/0009-hybrid-multi-tenancy.md), [ADR
  13](architecture/decisions/0013-operator-access-by-partner-grant.md)).
- **No double charges.** Each ride's payment runs in one workflow named after
  the ride ([ADR 12](architecture/decisions/0012-payment-capture-workflow.md)).
- **Survives losing the cloud account.** Encrypted, immutable copies and keys
  live outside AWS ([ADR
  1](architecture/decisions/0001-aws-primary-azure-for-off-provider-recovery.md)).
- **Security reviewed before code:** 31 threats, each with a planned control or
  a tracked risk ([threat model](architecture/security/threat-model.md)).

## Top risks

| Risk | What would make it real | Response |
|---|---|---|
| Too few partners ([A-09](architecture/requirements/assumptions.md)) | The plan needs 20; none is signed | Gate 2 below; the scenarios show the downside |
| Legal reading is wrong ([A-02](architecture/requirements/assumptions.md)) | Fee, receipt or controller rules differ | Gate 1 below |
| One person runs it ([RISK-004](architecture/risks/architecture-risks.md)) | Outages and support at 20 partners | Two hires in the plan ([A-10](architecture/requirements/assumptions.md)); partners staff dispatch |
| Recovery never tested ([RISK-009](architecture/risks/architecture-risks.md)) | A backup that cannot be restored | Gate 3 below |

## Gates

1. **Before build:** a Hungarian lawyer confirms the regulatory memo and the
   joint-controller model ([ADR
   11](architecture/decisions/0011-joint-controllers-with-partners.md)).
2. **Before any code beyond a thin prototype:** one dispatch company signs a
   letter of intent at about 10,000 HUF per car per month.
3. **Before launch:** the first restore drill is recorded, including the Azure path.

## Not yet known

Nothing is built or measured. The interfaces to BKK, the certified taxi meter
and the invoicing provider are not yet defined; all quality targets are targets,
not results.
