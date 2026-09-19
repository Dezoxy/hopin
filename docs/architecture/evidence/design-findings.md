# Design findings

What the design process caught before any production code existed, how it was caught, and what changed as a result. Each finding links to where the change is recorded. Hopin is a case study, so these are findings from legal reading, modelling, costing, a thin running slice, review and checks against vendor documentation. None came from production.

## By method

| Method | Findings |
|---|---|
| Reading the law | 2 |
| Drawing the model | 1 |
| Design review | 1 |
| Costing | 1 |
| Running the slice | 3 |
| Code review | 3 |
| Checking vendor documentation | 1 |

## Findings

| # | Found | How | What changed | Record |
|-|--------|----|--------|-----|
| 1 | A Budapest dispatch operator needs 100 M HUF equity, BKK-certified software and staffed dispatch around the clock, including phone orders. A solo founder cannot be the operator. | Reading the taxi law and decrees (S002) | The business became a white-label platform for licensed partners, who hold the licence and staff dispatch. One app serves all partners, with one partner per order. | [S002 memo](../../compliance/s002-regulatory-memo.md), [ADR 10](../decisions/0010-one-app-for-all-partners.md), [RISK-001](../risks/architecture-risks.md), [RISK-013](../risks/architecture-risks.md) |
| 2 | The payable fare is the certified meter amount at official rates, so there are no upfront prices, discounts or surge pricing. | Reading the law (S002) | The card is authorised for 1.3 times the estimate and captured at the meter amount, with any difference charged separately. | [C-02](../requirements/constraints.md), [ADR 12](../decisions/0012-payment-capture-workflow.md) |
| 3 | Losing the AWS account also loses every user's identity: Cognito credentials cannot be exported. | Drawing the AccountRecovery view: the restored API had nothing to validate tokens against | A replacement identity was added to the Azure restore path; users re-enrol by SMS code using phone numbers from the dump. | [RISK-017](../risks/architecture-risks.md), AccountRecovery view |
| 4 | The first payment design, a job queue with idempotent workers and a reconciler, was more moving parts than one operator can run. | Review of the ADR 12 draft | A managed Step Functions workflow per ride, named by the ride ID, replaced it. The outbox only starts the workflow. | [ADR 12](../decisions/0012-payment-capture-workflow.md) |
| 5 | Road-ETA matching makes Mapbox almost five times the AWS bill by year 3 of the ambitious case. | Three-year cost model (S120) | Candidates are pre-ranked by straight-line distance, and only the best three go to the routing API. Self-hosted routing is a named lever. | [RISK-019](../risks/architecture-risks.md), [cost model](../../business/three-year-cost-model.md) |
| 6 | With drivers reporting every 3 s, the oldest position a passenger saw was 3.01 s, over the 3 s target. The interval, not the system, set the number. | Load test run 1 (S123) | Drivers report every 2.5 s. Run 2 measured a worst case of 2.57 s. | [QA-02](../requirements/quality-attributes.md), [evidence](s123-slice-results.md) |
| 7 | Events can arrive before the client subscribes: eight of nine "no driver" results were missed by the load client. | Load test run 1 (S123) | Re-reading ride state over REST after subscribing is a required client rule, not an option. | [Event catalog](../integration/event-catalog.md), [evidence](s123-slice-results.md) |
| 8 | On shutdown, the realtime adapter closed while a dispatch was still running. Under load, that would crash every deploy. | A test that failed half the time | Matching and the outbox relay wait for in-flight work before the adapter closes. The test then passed eight runs out of eight. | [Evidence](s123-slice-results.md) |
| 9 | Pending offers were keyed by ride only, so a driver in another partner with the same driver ID could cancel a live offer. | TypeScript code review of the slice | Offers carry their tenant. A failing test reproduced the bug first. | [QA-12](../requirements/quality-attributes.md), [evidence](s123-slice-results.md) |
| 10 | The outbox relay promised at-least-once delivery to clients, which Socket.IO cannot give. | Code review of the slice | The stated guarantee is now at least once to the Redis adapter and at most once to the client. | [Evidence](s123-slice-results.md), [event catalog](../integration/event-catalog.md) |
| 11 | The AI draft check caught refund promises only in English, although the model replies in Hungarian. The real ride ID also reached the model. | Code review of the AI assistant | Hungarian promise patterns were added and the ride ID was removed, each after a failing test. Disguised contact details remain a stated residual risk. | [T-30](../security/threat-model.md#tb-7-hopin-to-model-providers), [T-31](../security/threat-model.md#tb-7-hopin-to-model-providers) |
| 12 | The "EU region" check accepted any region named "eu-", including London and Zurich. The default, Frankfurt, cannot run Claude Opus 5 on the Bedrock endpoint the slice uses. | Checking AWS's documentation before accepting ADR 15 | Only EU member-state regions with that endpoint are allowed, and the default moved to Ireland. The documentation also confirmed there is no cross-region routing on that endpoint, so ADR 15 was accepted. | [ADR 15](../decisions/0015-bedrock-for-data-openrouter-for-evaluation.md), [RISK-020](../risks/architecture-risks.md) |

## What the pattern shows

- **Cheap methods found the expensive problems.** Reading the law and costing the design changed the business model and the matching design before any code existed.
- **Running code found what design could not.** The shutdown race and the cross-partner offer bug only appeared once the slice ran and was reviewed.
- **Written claims need a source check.** The outbox guarantee and the EU-only claim both read well and were both wrong until they were checked.

## Not found yet

Some problems only a real deployment would surface. These are open, not solved:

- **No restore path has been drilled,** so the recovery targets are unproven ([RISK-009](../risks/architecture-risks.md)).
- **Matching latency with a real road-ETA call** has not been measured ([QA-01](../requirements/quality-attributes.md)).
- **The taxi-meter interface is unknown** until a meter vendor is chosen ([T-23](../security/threat-model.md#tb-6-hopin-to-regulators-and-partners)).
