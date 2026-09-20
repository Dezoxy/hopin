# 11. Hopin and each partner are joint controllers for partner rides

Date: 2026-09-19

## Status

Proposed

<!-- Adopted by the founder on 2026-09-19. Stays Proposed until the lawyer
confirms the controller roles in plan step S111. -->

## Context

GDPR assigns duties by role. The controller decides why and how personal data is
processed and carries most of the liability; a processor acts only on a
controller's instructions. Under Hungarian law each licensed dispatch partner
must itself record and keep orders and let BKK inspect them ([S002
memo](../../compliance/s002-regulatory-memo.md)). Hopin, through one app for all
partners ([ADR 10](0010-one-app-for-all-partners.md)), holds passenger accounts
across partners and runs the Hopin consumer brand.

## Decision drivers

- Roles must match the legal reality, or the processing agreements are void.
- The Hopin brand needs to own the passenger relationship.
- A solo company should not carry liability it does not need.

## Considered options

1. Hopin sole controller for all data.
2. Joint controllers (GDPR Article 26): Hopin and each partner for that
   partner's rides; Hopin sole controller for Hopin-brand accounts.
3. Partner controller, Hopin processor, as in typical SaaS.

## Decision

We propose joint controllership for partner rides and sole Hopin controllership
for passenger and driver accounts and for Hopin-brand rides. A written
arrangement with each partner splits the duties: the partner answers for its
statutory order records and BKK reporting; Hopin answers for the platform,
security, access requests and breach notification. Passengers are told which
partner is joint controller for each ride.

Option 1 was rejected because the partner's statutory record-keeping makes it a
controller whether or not a contract says so. Option 3 was rejected because the
partner would then own passenger data, which undercuts the Hopin brand.

## Consequences

Positive:

- Roles follow the law, so the arrangement can survive a regulator's review.
- Hopin keeps the passenger relationship for its consumer brand.

Negative / accepted trade-offs:

- Hopin carries controller liability: DPIA, breach notification and data subject
  requests are Hopin's work ([C-09](../requirements/constraints.md)).
- Each partner signs a joint-controller arrangement before going live.
- The DPIA (plan step S100) must describe both roles.

## Risks

- The lawyer may reject this split; then the ADR is superseded before any
  partner goes live ([A-02](../requirements/assumptions.md)).

## Related

- Requirements: [C-09](../requirements/constraints.md), [data classification](../security/data-classification.md).
- Other ADRs: [9. Hybrid multi-tenancy](0009-hybrid-multi-tenancy.md), [10. One
  app for all partners](0010-one-app-for-all-partners.md).
