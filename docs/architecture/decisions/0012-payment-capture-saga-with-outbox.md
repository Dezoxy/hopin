# 12. Capture the meter amount through a transactional outbox and idempotent jobs

Date: 2026-09-19

## Status

Proposed

## Context

Only the taxi-meter amount may be charged ([C-02](../requirements/constraints.md)). It is known only when the driver completes the ride, while the card is authorised earlier for an estimate ([ADR 7](0007-stripe-connect-payments.md)). Completing a ride, capturing the money and telling the passenger are separate steps across the database, Redis and Stripe, and any of them can fail or run twice. A double charge breaks [QA-09](../requirements/quality-attributes.md); a lost capture loses the fare.

## Decision drivers

- Exactly one successful capture per ride ([QA-09](../requirements/quality-attributes.md)).
- Ride completion must not wait on Stripe.
- Redis can be lost at any moment ([RISK-008](../risks/architecture-risks.md)).
- One operator: no extra infrastructure to run.

## Considered options

1. Capture synchronously inside the ride-completion request.
2. Transactional outbox in PostgreSQL, a relay that queues jobs in BullMQ, idempotent workers, Stripe webhooks as confirmation.
3. A workflow engine such as Temporal or AWS Step Functions.

## Decision

We propose option 2.

1. **One transaction** writes the ride as COMPLETED with the meter amount, a ride event and a `ride.completed` outbox entry.
2. **The outbox relay** reads committed entries and queues a capture job keyed by ride ID. Delivery is at least once.
3. **The payments worker** captures with the Stripe idempotency key `ride:<id>:capture`. A second job for the same ride returns the first result.
4. **The Stripe webhook** is the confirmation. It marks the payment captured and writes a `payment.captured` outbox entry, idempotent by Stripe event ID.
5. **Meter above the authorised amount:** the worker captures the authorised amount and charges the difference as a second off-session payment with its own idempotency key.
6. **Declined capture:** three retries over 24 hours with backoff, then FAILED, a `payment.failed` entry, a push asking for a new card, and new rides blocked until paid.
7. **Reconciler:** a scheduled job re-queues outbox entries whose effect is not recorded after 15 minutes. This covers jobs lost with Redis. A nightly job compares payments with Stripe (plan step S044).

Not decided: who carries the loss when a capture finally fails: Hopin, the partner or the driver. That is a commercial decision for the partner contract.

## Consequences

Positive:

- A crash at any step leaves a committed record to resume from; nothing depends on Redis surviving.
- Completion answers the driver immediately; Stripe latency never blocks the ride.
- No new infrastructure: PostgreSQL and the existing Redis.

Negative / accepted trade-offs:

- Every consumer must be idempotent, forever. A non-idempotent consumer added later reintroduces double effects.
- The passenger sees "payment processing" for seconds, not a synchronous result.
- The outbox table grows and needs cleanup of published entries.
- Option 3 would give visible workflow state and built-in retries, at the cost of another system to operate; reconsider if flows grow beyond payments.

## Risks

- Duplicate effects from a non-idempotent consumer ([QA-09](../requirements/quality-attributes.md)); covered by tests that deliver every job twice.

## Related

- Requirements: [C-02](../requirements/constraints.md), [QA-09](../requirements/quality-attributes.md).
- Architecture views: PaymentCapture, PaymentCaptureDeclined, ApiMoneyAndCompliance.
- Other ADRs: [5. Redis and Socket.IO](0005-redis-socketio-realtime.md), [7. Stripe Connect](0007-stripe-connect-payments.md).
