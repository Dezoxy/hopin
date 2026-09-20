# S123 Evidence: Thin Slice and Load Test

> **Status:** two measurements, 2026-09-19. Local machine, not production. Raw
  results: [run 1, 3 s reporting](s123-load-2026-09-19.json) and [run 2, 2.5 s
  reporting](s123-load-2026-09-19-run2.json). Code:
  [slice/](../../../slice/README.md).

## What was built

A running cut of the Hopin API: request a ride, pre-filter free taxis in Redis
GEO, rank them, offer the ride, match it exactly once, publish MATCHED through
the transactional outbox, and stream the driver's position over Socket.IO. It
uses the designed stack: NestJS, PostgreSQL with row-level security per tenant,
Redis, Socket.IO with the Redis adapter.

Deliberately stubbed: Cognito (identity headers instead of tokens), Mapbox
(straight-line ETA instead of road ETA with traffic), durable offer timers (in
memory, one instance), payments. The [slice README](../../../slice/README.md)
lists each.

## Results

Setup: API as one Node.js process, PostgreSQL 16 and Redis 7 in Docker, load
generator as a separate process, all on one Apple M1 Pro (8 cores, 16 GB). 200
drivers over two tenants, each reporting position every 3 s; 50 ride requests a
minute for 3 minutes.

| Quality attribute | Target | Measured | Verdict |
|---|---|---|---|
| [QA-01](../requirements/quality-attributes.md) request → offer to driver | p95 < 2 s | p50 13 ms, p95 23 ms, p99 40 ms, max 58 ms (141 offers) | Met locally, with a large margin |
| [QA-02](../requirements/quality-attributes.md) driver position age on the passenger's screen | ≤ 3 s | p50 1.47 s, p95 2.85 s, p99 2.98 s, max 3.01 s (15,984 samples) | Met at p95; the maximum exceeds it by 14 ms |
| Position delivery, driver to passenger | — | p50 4 ms, p95 10 ms, max 53 ms (5,928 messages) | Transport is not the bottleneck |
| [QA-09](../requirements/quality-attributes.md) no double match | 0 duplicates | 141 rides matched, 141 outbox entries, 0 unpublished | Met |
| [QA-12](../requirements/quality-attributes.md) tenant isolation | 0 cross-tenant reads | Enforced by tests, including a query with no tenant set returning 0 rows | Met in tests |

| Other counts | Value |
|---|---|
| Ride requests / HTTP errors | 150 / 0 |
| Matched / no driver | 141 / 9 |
| API CPU, average and maximum | 6.9 % / 13.6 % of one core |
| API memory, maximum | 200 MB |

## What the numbers mean

1. **Matching is far inside its budget, but the real cost is missing.** 23 ms at
   p95 leaves almost the whole 2 s for the step the slice stubs: a road-ETA call
   to the Matrix API, typically a few hundred milliseconds. QA-01 is not proven
   until that call is in the path.
2. **QA-02 is set by the reporting interval, not by the system.** Transport
   takes 10 ms at p95; the rest is the time between driver reports. With 3 s
   reporting the maximum was 3.01 s, over the target. The founder chose to
   report every 2.5 s, inside the 5 s legal limit
   ([C-05](../requirements/constraints.md)); run 2 below confirms the headroom.
3. **Events can arrive before the client listens.** The passenger joins the
   ride's channel after the ride request returns; eight of the nine "no driver"
   results were announced before that, so the load client missed them. The
   design rule in the [event catalog](../integration/event-catalog.md), re-read
   state over REST after subscribing, is necessary, not optional.
4. **The nine unmatched rides are expected.** Drivers never finish rides in this
   test, so about 70 of each tenant's 100 drivers were busy by the end, and some
   pickups had no free taxi within 5 km.
5. **Resource use is small at this load.** 200 drivers and 50 rides a minute
   used 14 % of one core at most. Scale limits will come from Redis fan-out and
   the Matrix API, not from the API process.

## Run 2: reporting every 2.5 s

Same setup, after the founder's decision on QA-02.

| | Run 1, 3 s | Run 2, 2.5 s |
|---|---|---|
| QA-02 position age p95 / max | 2.85 s / 3.01 s | **2.38 s / 2.57 s** |
| QA-01 offer latency p95 | 23 ms | 22 ms |
| Position delivery p95 | 10 ms | 10 ms |
| Matched / no driver | 141 / 9 | 134 / 16 |
| API CPU max / memory max | 13.6 % / 200 MB | 8.3 % / 204 MB |

QA-02 now holds with 0.43 s to spare at the worst sample. About 20 % more
location messages cost no visible CPU at this load. The different no-driver
count comes from random pickups and driver positions in each run, not from the
interval.

## Quality of the slice itself

- 29 tests: 20 unit, 6 integration against real PostgreSQL and Redis, 3
  end-to-end with real sockets. Coverage 92 % of statements, 94 % of lines, 66 %
  of branches; the uncovered branches are mostly validation failures and error
  paths.
- Mutation checks: removing the state guard on accept, or opening the row-level
  security policy, each makes tests fail.
- **A real bug found by testing:** on shutdown, Nest closed the Socket.IO
  adapter while a dispatch was still running, which crashed the late publish on
  a closed Redis connection. It surfaced as a test that failed half the time.
  Matching and the outbox relay now wait for in-flight work before the adapter
  closes; the same test then passed 8 runs out of 8. In production this would
  have been a crash during every deploy under load.

- **Code review findings, fixed before merge:** a TypeScript review found that
  pending offers were keyed by ride only, so a driver in another tenant with the
  same driver ID could cancel a live offer and leave the ride stuck in
  REQUESTED. A failing test reproduced it; offers now carry their tenant. The
  review also found the outbox relay's comment promised at-least-once delivery
  to clients, which Socket.IO cannot give; it now states the real guarantee: at
  least once to the Redis adapter, at most once to the client.

## Follow-ups

- Put a real road-ETA call in the matching path and measure QA-01 again.
- ~~Decide the QA-02 interval~~ Decided: 2.5 s reporting (run 2).
- Passenger app: read ride state after subscribing (plan step S054).
- Load-test with drivers completing rides, so supply stays realistic.
