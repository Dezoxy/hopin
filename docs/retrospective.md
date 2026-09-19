# Retrospective

Written at the close of the portfolio track, 2026-09-19. What I would do differently, what is still weak, and the decision that would come next if Hopin were built.

## What I would do differently

- **Read the law before planning the build.** The first plan had 110 build steps. The regulatory reading that followed changed the fare model, removed surge pricing and promotions, and turned the product into a platform for licensed partners ([design findings](architecture/evidence/design-findings.md), findings 1 and 2). An afternoon with the statutes first would have saved a plan rewrite.
- **Run code earlier.** The thin slice came late, and it found three problems as soon as it ran: the reporting interval, events arriving before the subscription, and a shutdown race. A slice in the first week would have tested the riskiest assumptions while they were still cheap to change.
- **Make the work visible from the start.** For most of the project a reviewer on GitHub saw Structurizr code and no diagram. The reading path and rendered diagrams came last. They should have come with the first views.
- **Check claims against sources as a habit, not an event.** Four written claims were wrong until something forced a check: the outbox delivery guarantee, the EU-only region check, ADR 1 calling an untested restore path "tested", and two recovery targets that disagreed. Each read well.

## What is still weak

- **No human has challenged the decisions.** Every ADR has one author. The review below was run by an AI agent, which is useful but not the same as a peer. The first thing to do with this portfolio is to hand ADRs 9 and 12 to an architect and record what changes.
- **The legal reading is not legal advice.** ADR 11 on controller roles stays Proposed until a lawyer confirms it, and the regulatory memo says so in its status line.
- **Recovery is unproven.** No restore path has been drilled, so the recovery targets are designed, not demonstrated ([RISK-009](architecture/risks/architecture-risks.md)).
- **The business inputs are judgements.** Driver interviews and the first partner conversation were dropped when the project became a case study. The partner count, the price per car and the absence of a build period in the cost model are assumptions ([A-08](architecture/requirements/assumptions.md), [A-09](architecture/requirements/assumptions.md), [cost model](business/three-year-cost-model.md)).
- **Matching latency is only half measured.** The slice leaves out the road-ETA call the law requires ([QA-01](architecture/requirements/quality-attributes.md)).
- **One person cannot cover nights.** A platform outage at night becomes the partner's licence problem, so partner contracts need a manual fallback ([RISK-022](architecture/risks/architecture-risks.md)).

## Review by an AI critic

On 2026-09-19 an AI agent reviewed the key ADRs, the findings and the risk register as a sceptical principal architect. It raised five challenges and two smaller points. All were checked against the files and found to be real.

| Challenge | What changed |
|---|---|
| Two documents gave different recovery points after a region loss (5 min and 24 h). The Azure capture fallback selected rides by outbox state and would skip a ride whose workflow started but never captured. | [QA-04](architecture/requirements/quality-attributes.md) now matches the disaster-recovery table: 24 h after a region loss. The fallback selects completed rides without a final payment state ([disaster recovery](architecture/reliability/disaster-recovery.md), [ADR 12](architecture/decisions/0012-payment-capture-workflow.md)). |
| ADR 12 credited the workflow name for preventing double charges, but the Stripe idempotency key does that in both designs. The rejected design's reconciler also survives as the nightly Stripe check. | ADR 12 says where the guarantee comes from, keeps the reconciliation, and names the disaster-only capture script as a risk. |
| The cost model prints one decimal from judgement inputs, has no build period, and a finding described a cost lever as already done. | The model states its precision and the missing build period; the finding now calls pre-ranking a lever. |
| The README quoted a 23 ms matching time without saying the road-ETA call was missing. | The README says so. |
| A 99.5 % target sits oddly with one person on call, and nothing covered a night outage for partners who must dispatch by law. | A new failure row in [availability](architecture/reliability/availability.md) and [RISK-022](architecture/risks/architecture-risks.md). |
| The executive summary counted 26 threats; there are 31. ADR 13 overstated what a stolen operator session cannot do. | Counts corrected; ADR 13 names the break-glass credentials that bypass row-level security. |

## The next decision

If Hopin were built, the next decision is not technical. It is whether one licensed dispatch company signs a letter of intent at the assumed price. That is gate 2 in the [executive summary](executive-summary.md). Without it, nothing else in this repository should be built. With it, the first engineering step is the restore drill, because it is the cheapest way to turn the largest unproven claim into evidence.
