# 10. Ship one passenger app and one driver app for all partners

Date: 2026-09-19

## Status

Accepted

## Context

Each partner dispatch company must offer its passengers a downloadable app
([C-06](../requirements/constraints.md)). Hopin could publish a separately
branded app per partner, or one Hopin app that serves every partner. The
business case puts the Hopin consumer brand second, behind white-label.

## Decision drivers

- One person maintains the apps and their store listings.
- App store review takes days per build ([RISK-003](../risks/architecture-risks.md)).
- Partners want their own name visible to their passengers.
- The Hopin brand should own the passenger relationship over time.

## Considered options

1. One passenger app and one driver app, branded Hopin, showing partner branding inside.
2. A separately branded app per partner, built from the same codebase.

## Decision

We will publish one Hopin passenger app and one Hopin driver app. Partner name,
colours and logo come from tenant theming ([ADR
9](0009-hybrid-multi-tenancy.md)) and are shown on the booking screen, the ride
screen and receipts. Budapest rules already require the dispatch company's name
on card receipts.

**Every order belongs to exactly one partner before dispatch.** The passenger
reaches a partner through a partner link, QR code or explicit choice; that
partner's drivers receive the offer. Hopin does not match an order across
partners. Doing so could make Hopin the party organising the ride, which needs
its own dispatch licence ([C-01](../requirements/constraints.md)). Cross-partner
matching is allowed only if the lawyer confirms it in plan step S111.

## Consequences

Positive:

- One build pipeline, one store listing per platform, one review queue.
- Passengers who install the app for one partner are already Hopin users; the
  consumer brand grows from partner traffic.

Negative / accepted trade-offs:

- Some partners will refuse to send their passengers to a Hopin-branded app.
  They are not the target customer for now.
- Without cross-partner matching, a passenger waits longer when their chosen
  partner has no free car.
- A partner who leaves keeps its licence but its passengers keep the Hopin app,
  which partners may see as a reason not to join. The partner contract must
  address this.

## Risks

- Partners reject the Hopin-branded app, tracked as [RISK-016](../risks/architecture-risks.md).

## Related

- Requirements: [C-01](../requirements/constraints.md), [C-06](../requirements/constraints.md).
- Other ADRs: [2. Expo and
  Next.js](0002-expo-for-mobile-apps-and-next-static-admin.md), [9. Hybrid
  multi-tenancy](0009-hybrid-multi-tenancy.md).
