# 7. Use Stripe and Stripe Connect for fares and driver payouts

Date: 2026-09-19

## Status

Proposed

## Context

Passengers pay by card or wallet in the app. Drivers must be paid out. Card data
must stay out of Hopin's systems.

## Decision drivers

- PCI scope limited to SAQ-A (plan A7).
- Apple Pay and Google Pay support.
- Driver payouts without building a ledger.

## Considered options

1. Stripe with Connect Express accounts.

Alternatives were not recorded. Local providers should be compared during plan step S041.

## Decision

We propose Stripe for card and wallet payments and Stripe Connect Express for
driver payouts. An amount above the estimate is authorised when a driver
accepts. The taxi-meter amount is captured when the ride completes, because only
the meter amount may be charged ([C-02](../requirements/constraints.md)).

## Consequences

Positive:

- Card data goes from the app straight to Stripe.
- Payouts and driver onboarding for payouts are handled by Stripe.

Negative / accepted trade-offs:

- Hungarian invoicing still needs a separate provider (plan step S002).

## Risks

- Fraud and disputes (plan Part G).

## Related

- Architecture views: Context, Backend, RideRequest.
