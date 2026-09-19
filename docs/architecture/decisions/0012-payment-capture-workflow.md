# 12. Capture the meter amount with an outbox-started Step Functions workflow

Date: 2026-09-19

## Status

Accepted

## Context

Only the taxi-meter amount may be charged ([C-02](../requirements/constraints.md)). It is known only when the driver completes the ride, while the card is authorised earlier for an estimate ([ADR 7](0007-stripe-connect-payments.md)). Completing a ride, capturing the money and telling the passenger span the database, Stripe and push notifications, and any step can fail or run twice. A double charge breaks [QA-09](../requirements/quality-attributes.md); a lost capture loses the fare.

The first draft of this ADR used a job queue with idempotent workers and a reconciler. On review, the founder chose a managed workflow engine instead, keeping the outbox only to start the workflow reliably.

## Decision drivers

- Exactly one successful capture per ride ([QA-09](../requirements/quality-attributes.md)).
- Ride completion must not wait on Stripe.
- Redis can be lost at any moment ([RISK-008](../risks/architecture-risks.md)).
- Managed services first ([P-01](../principles/architecture-principles.md)); nothing new to operate.
- The service must be recoverable on Azure after losing the AWS account ([ADR 1](0001-aws-primary-azure-for-off-provider-recovery.md)).

## Considered options

1. Capture synchronously inside the ride-completion request.
2. Transactional outbox, BullMQ jobs, idempotent workers and a reconciler (the first draft).
3. Transactional outbox that starts an AWS Step Functions workflow per ride.
4. Temporal Cloud: portable to Azure, but a third vendor, a monthly minimum and another data processor.
5. Self-hosted Temporal: portable, but its services and database would have to be operated by one person.

## Decision

We will use option 3.

1. **One transaction** writes the ride as COMPLETED with the meter amount, a ride event and a `ride.completed` outbox entry.
2. **The outbox relay** starts a Standard Step Functions workflow **named by the ride ID**. Step Functions rejects a second execution with the same name, so a repeated start cannot create a second capture.
3. **The workflow captures** the meter amount through an HTTP task with the Stripe idempotency key `ride:<id>:capture`, then **waits with a task token**. The Stripe webhook handler resumes it, idempotent by Stripe event ID, and records the payment as captured with a `payment.captured` outbox entry.
4. **The hold is 1.3 times the estimate**, placed when a driver accepts. If the meter amount is higher, the workflow captures the hold and charges the difference as a second off-session payment with its own idempotency key.
5. **A declined capture** is retried by wait states, three attempts within 24 hours. After the last one, the workflow reports the failure to the Payments component, which records FAILED and a `payment.failed` outbox entry. The passenger is asked for a new card and new rides are blocked until paid.
6. **A finally failed fare is carried by the partner**, up to a monthly cap set in the partner contract. Above the cap, Hopin and the partner split it. The driver is always paid.
7. **In the Azure cold-restore case** there is no Step Functions. Captures run from a batch script over rides that are COMPLETED but have no payment in CAPTURED or FAILED, with the same idempotency keys, until AWS is back. It selects by ride and payment state, not by outbox state, because an entry already relayed may belong to a workflow that never captured.
8. A nightly job still compares payments with Stripe (plan step S044).

## Consequences

Positive:

- Retries, waits and the callback are declared, not hand-coded; every execution's history is visible for disputes.
- The payment job queue and its hand-coded retries disappear, and so does their Redis dependency. The nightly Stripe reconciliation stays.
- The protection against charging twice comes from Stripe idempotency keys, as it would in the queue design. The workflow adds declared retries and waits, visible run history, and a name that stops a second run for the same ride from starting.
- Cost at the business-case volume is negligible: about ten state transitions per ride, a few dollars a month.

Negative / accepted trade-offs:

- Lock-in to AWS Step Functions; the workflow definition does not move to Azure. The disaster fallback is slower and must be drilled (S096).
- Workflow execution history holds ride IDs and amounts for 90 days: a new place where payment data lives ([data classification](../security/data-classification.md)).
- The Stripe restricted key is also used by Step Functions, through an EventBridge connection that reads it from Secrets Manager.
- Consumers of outbox events must still be idempotent; the outbox delivers at least once.

## Risks

- The Azure capture fallback has never run; covered by [RISK-009](../risks/architecture-risks.md) until the first drill.

- The Azure capture script is a second implementation of payment capture that runs only in a disaster. It is only as trustworthy as the last drill that ran it ([RISK-009](../risks/architecture-risks.md)).

## Related

- Requirements: [C-02](../requirements/constraints.md), [QA-09](../requirements/quality-attributes.md).
- Architecture views: PaymentCapture, PaymentCaptureDeclined, ApiPayments, AccountRecovery.
- Other ADRs: [1. AWS primary, Azure for recovery](0001-aws-primary-azure-for-off-provider-recovery.md), [5. Redis and Socket.IO](0005-redis-socketio-realtime.md), [7. Stripe Connect](0007-stripe-connect-payments.md).
