## Transition Plan

From [current-state.md](current-state.md) to [target-state.md](target-state.md).
The detailed steps, statuses and dependencies are in [plan Part
D](../../hopin-plan.md#part-d--roadmap-and-step-list); this page records the
stage logic and exit criteria.

| # | Stage | Plan phase | Exit criterion | Closes |
|---|---|---|---|---|
| 1 | Decide how to enter the market | 0, 10 (S111) | Entry model chosen; lawyer has answered the memo's questions | [RISK-001](../risks/architecture-risks.md) |
| 2 | Foundations | 0–1 | Monorepo builds in CI; accounts, OIDC and Terraform state exist | — |
| 3 | Backend core and payments | 2–3 | Ride lifecycle and meter-amount capture pass integration tests | — |
| 4 | Apps | 4–6 | Passenger, driver and admin flows pass end-to-end tests against dev | — |
| 5 | Platform | 7 | Staging runs the full system; load test meets [QA-01](../requirements/quality-attributes.md) and [QA-02](../requirements/quality-attributes.md) | [RISK-008](../risks/architecture-risks.md) |
| 6 | Recovery and compliance | 8 | First restore drill recorded; DPIA signed off | [RISK-009](../risks/architecture-risks.md) |
| 7 | Launch | 9 | Store approval; soft launch in one district | [RISK-003](../risks/architecture-risks.md) |

### Sequencing logic

Stage 1 comes first because the entry model changes who operates the service,
which certification applies and who issues receipts. Building before it would
risk rework in payments and dispatch.

Stage 6 comes before launch: a backup that has never been restored does not
count as recovery ([QA-04](../requirements/quality-attributes.md)).
