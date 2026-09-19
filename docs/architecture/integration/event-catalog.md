# Event Catalog

Realtime events on Socket.IO. Schemas will live in `packages/shared` as zod definitions (plan step S006). Delivery is **at most once**: a client that reconnects re-reads ride state over REST, so no event is the only copy of a fact ([P-05](../principles/architecture-principles.md)).

| Namespace | Event | Direction | Payload (summary) | Rate | Notes |
|---|---|---|---|---|---|
| `/passenger` | `ride.state` | Server → passenger | ride ID, state, timestamp | On change | Room `ride:<id>` |
| `/passenger` | `driver.position` | Server → passenger | ride ID, lat, lng, heading | Every 3 s | [QA-02](../requirements/quality-attributes.md) |
| `/passenger` | `ride.eta` | Server → passenger | ride ID, ETA seconds | On change | |
| `/driver` | `location` | Driver → server | lat, lng, heading, speed, accuracy | Every 3 s while online | ≤ 5 s at ≤ 20 m required by [C-05](../requirements/constraints.md) |
| `/driver` | `offer.new` | Server → driver | offer ID, pickup, distance, estimate, expiry | Per offer | 15 s to accept |
| `/driver` | `offer.expired` | Server → driver | offer ID | Per offer | |
| `/driver` | `ride.state` | Server → driver | ride ID, state | On change | |
| `/driver` | `alarm` | Driver → server | position, type (attack, accident) | On press | Required by [C-06](../requirements/constraints.md); added after S002 |
| `/admin` | `ops.snapshot` | Server → admin | online drivers, active rides | Every 5 s | Aggregated |
| `/admin` | `driver.alarm` | Server → admin | driver, position, type | On alarm | Must reach the operator immediately |

Stripe webhook events consumed (`payment_intent.*`, `charge.refunded`, `payout.*`, `account.updated`) are handled idempotently by event ID.

## Outbox events

Written in the same transaction as the state change they describe, then relayed as jobs at least once ([ADR 12](../decisions/0012-payment-capture-saga-with-outbox.md)). Every consumer is idempotent by the key shown.

| Event | Written when | Consumers | Idempotency key |
|---|---|---|---|
| `ride.completed` | Driver completes the ride with the meter amount | Payments (capture), notifications | Ride ID |
| `payment.captured` | Stripe webhook confirms the capture | Notifications (ride summary), invoicing (Hopin fee) | Stripe event ID |
| `payment.failed` | Last capture retry declined | Notifications (update card), account block | Ride ID |
| `alarm.raised` | Driver presses the alarm | Monitoring page, partner console | Alarm ID |
| `taxi.meter` | Meter starts or stops | BKK real-time feed (S112) | Ride ID plus event time |
