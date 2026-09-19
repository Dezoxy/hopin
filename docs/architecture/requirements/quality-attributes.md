# Quality Attributes

Each attribute is measurable and has an architectural consequence. Decisions and risks refer to these IDs. All are **targets**. A thin running slice measured QA-01, QA-02, QA-09 and QA-12 locally on 2026-09-19 ([evidence](../evidence/s123-slice-results.md)); nothing has been measured in a deployed environment.

| ID | Attribute | Target | Architectural consequence | Validated by |
|---|---|---|---|---|
| QA-01 | Match latency | First offer sent < 2 s after a ride request (p95) | Redis GEO pre-filter plus road-ETA ranking ([ADR 5](../decisions/0005-redis-socketio-realtime.md), [C-04](constraints.md)) | Load test (plan S092). Local slice: p95 23 ms without a road-ETA call ([evidence](../evidence/s123-slice-results.md)) |
| QA-02 | Location freshness | Driver position ≤ 3 s old on the passenger screen; ≤ 5 s at ≤ 20 m from the car device | Socket.IO fan-out through Redis; drivers report every 2.5 s, chosen after the first measurement ([C-05](constraints.md)) | Load test (S092). Local slice at 2.5 s: p95 2.38 s, max 2.57 s ([evidence](../evidence/s123-slice-results.md)) |
| QA-03 | Availability | API 99.5 % monthly (about 3.6 h downtime) | Single region, Multi-AZ database, two API tasks; no multi-region ([availability.md](../reliability/availability.md)) | CloudWatch SLO dashboard |
| QA-04 | Recoverability | RPO 5 min, RTO 1 h for corruption within the region; RPO 24 h, RTO 4 h after region loss; RPO 24 h, RTO 24 h after losing the AWS account | PITR, cross-region copy, nightly off-provider dump ([disaster-recovery.md](../reliability/disaster-recovery.md)) | Quarterly restore drill (S096) |
| QA-05 | Data residency | All personal data at rest in EU regions | AWS eu-central-1 and eu-west-1; Azure EU region; EU processors only ([P-04](../principles/architecture-principles.md)) | Processor register in the DPIA (S100) |
| QA-06 | Payment security | PCI DSS SAQ-A scope only; no card data on Hopin systems | Card entry in Stripe SDKs only ([ADR 7](../decisions/0007-stripe-connect-payments.md)) | Stripe SAQ-A attestation |
| QA-07 | Accessibility | WCAG 2.1 AA on web; platform accessibility basics on mobile | Accessible component library in `packages/ui` | Automated and manual audit before launch |
| QA-08 | Cost | Idle production ≤ ~150 EUR/month before real traffic | Single-AZ and no NAT until the first paying partner, dev scale-to-zero ([deployment-architecture.md](../deployment/deployment-architecture.md#cost), [cost model](../../business/three-year-cost-model.md)) | AWS Budgets (S019), cost review (S102) |
| QA-09 | Charge correctness | 0 duplicate charges; every capture equals the taxi-meter amount | Idempotency keys; capture from meter data ([C-02](constraints.md)) | Nightly Stripe reconciliation (S044) |
| QA-10 | Detection | A page-worthy failure alerts the operator within 5 min | Alarms in [observability-architecture.md](../observability/observability-architecture.md) | Alert test during drills |
| QA-11 | Auditability | Every ride state change and admin action traceable for 2 years | Append-only `ride_events` and `audit_log` | Dispute and refund walkthrough |
| QA-12 | Tenant isolation | 0 reads or writes across partners | Row-level security on every partner-owned table; tenant set per transaction ([ADR 9](../decisions/0009-hybrid-multi-tenancy.md)) | Automated cross-tenant tests in CI on every schema change |
| QA-13 | Draft safety | 0 drafts reach staff that cite an unknown ride event or promise money; every candidate model passes all evaluation cases before use | Draft checks in code, not only in the prompt; evaluation harness with the same checks ([ADR 14](../decisions/0014-ai-assists-staff-read-and-draft-only.md)) | Slice tests in CI; evaluation run per model change (`pnpm eval`) |

## Scenario example

```text
Source:        Passenger app
Stimulus:      Sends the same ride request twice after a network timeout
Environment:   Normal operation
Response:      The second request returns the first ride; one card authorisation only
Measure:       0 duplicate rides or authorisations per month (QA-09)
```
