# Talk Tracks

Three ways to present Hopin, built from the accepted views and their [speaker notes](speaker-notes.md). Show each view with `make view` or from the architecture PDF (`make pdf`), which contains every view. Timings are targets for spoken English; rehearse against a clock and record yourself (plan step S124).

## Track 1: the three-minute version

For a recruiter, a hiring manager, or the first minutes of an interview.

| Time | View | The one sentence |
|---|---|---|
| 0:00 | Context | "A white-label dispatch platform for licensed Hungarian taxi companies: three kinds of users, three outside services." |
| 0:45 | Authorities | "The law decides the product: the meter sets the fare, BKK gets live data, NAV gets the receipts." |
| 1:30 | RideRequest | "A ride from request to matched driver, where the card is charged only after a driver accepts, and only the meter amount." |
| 2:15 | *(risk register)* | "The top risk was never technical: Budapest dispatch needs 100 million forints of equity, which is why this is a platform for licensed partners." |

Close with the reusable rule: *never let the platform become the licensed party by accident* ([ADR 10](../decisions/0010-one-app-for-all-partners.md)).

## Track 2: the fifteen-minute architecture interview

For a design interview or an architecture review. Leave five minutes for questions.

| Time | View | What to land |
|---|---|---|
| 0:00 | Context | Scope and users |
| 1:00 | Authorities | Constraints before design |
| 2:30 | Clients | One API, four clients, one without login |
| 3:30 | ApiRideFlow | Modular monolith, road-distance matching |
| 5:00 | PartnerConsole → PartnerIsolation | Tenancy enforced by the database |
| 7:00 | PaymentCapture | Outbox plus a workflow named by ride ID: exactly-once effect |
| 9:00 | Security | Entry points and trust boundaries |
| 10:00 | ProductionCore | One region, honest failure domains |
| 11:00 | OffProviderRecovery → AccountRecovery | Multi-cloud only for the failure you fear; the identity gap it revealed |
| 12:30 | *(ADR list)* | What is Accepted, what is Proposed and why ADR 11 waits for a lawyer |

Close with the decision you would reverse first if the load grew tenfold. Suggested answer: the single Redis node and the shared database, in that order, and what would trigger each.

## Track 3: deep dives on demand

Keep these ready; use them when the interviewer pulls a thread.

| If they ask about | Show | Then |
|---|---|---|
| Failure handling | RedisLost, PaymentCaptureDeclined | AlertPath |
| Data protection | LocationData | [data classification](../security/data-classification.md), [ADR 11](../decisions/0011-joint-controllers-with-partners.md) |
| Delivery and operations | Delivery | AlertPath, AwsBackups |
| Disaster recovery | RegionRecovery, AccountRecovery | [disaster recovery](../reliability/disaster-recovery.md) |
| Safety features | DriverAlarm, TripShare | [trust boundaries](../security/trust-boundaries.md) |
| The partner business | PhoneOrder, PartnerConsole | [business case](../../business/business-case.md) |
| Async and consistency | ApiPayments, PaymentCapture, ApiRegulatoryFeeds | [ADR 12](../decisions/0012-payment-capture-workflow.md), [event catalog](../integration/event-catalog.md) |
| AI | AiAssist, DisputeAssist | [ADR 14](../decisions/0014-ai-assists-staff-read-and-draft-only.md), [ADR 15](../decisions/0015-bedrock-for-data-openrouter-for-evaluation.md), [AI Act classification](../../compliance/ai-act-classification.md) |

## Track 4: the recorded walkthrough

The script for plan step S124: one take of about ten minutes, screen-shared, following the README's ten-minute review. Show the README diagrams and the published PDF; no slides are needed.

| Time | On screen | Say |
|---|---|---|
| 0:00 | README, top | "Hopin is a reference architecture for taxi dispatch in Hungary. It is not a product. I designed it end to end to show how I make architecture decisions under real constraints." |
| 0:45 | Executive summary | The recommendation in one sentence, the three gates, and why the consumer brand comes second. |
| 2:00 | Design findings | Pick three findings, one per method: the law (the 100 M HUF rule), drawing (the identity gap), and running code (the shutdown race). Land the pattern: cheap methods found the expensive problems. |
| 4:00 | Partner isolation diagram, ADR 9 | Why row-level security instead of a database per partner, and the sales trigger for a silo. |
| 5:30 | ADR 12 | Exactly-once effect: the workflow is named by the ride, and the meter amount is captured, not the estimate. |
| 7:00 | Recovery diagram, ADR 1 | A second cloud for the failure you fear. The gap the drawing exposed, and why nothing counts until a drill (RISK-009). |
| 8:30 | Retrospective | One thing you would do differently, one weakness you have not fixed, and the next decision. |
| 9:30 | README | Close with the reusable rule you want remembered: *never let the platform become the licensed party by accident.* |

Record it once, watch it back, and cut anything you read from the screen instead of saying. Link the recording from the README when it is published.

## Slides

Slides redrawn in a design tool follow architect-base's `presentation.md`: drawn only from accepted views, from a library that uses the colours in `styles.dsl`, and logged in a ledger next to this file. Until that exists, present the views themselves or the PDF.
