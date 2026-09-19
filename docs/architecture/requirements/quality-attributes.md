# Quality Attributes

Each attribute is measurable and has an architectural consequence. Decisions and risks refer to these IDs. All are **targets**: nothing is built, so no value has been measured yet.

| ID | Attribute | Target | Architectural consequence | Validated by |
|---|---|---|---|---|
| QA-01 | Match latency | First offer sent < 2 s after a ride request (p95) | Redis GEO pre-filter plus road-ETA ranking ([ADR 5](../decisions/0005-redis-socketio-realtime.md), [C-04](constraints.md)) | Load test (plan S092) |
| QA-02 | Location freshness | Driver position ≤ 3 s old on the passenger screen; ≤ 5 s at ≤ 20 m from the car device | Socket.IO fan-out through Redis; 3 s emit interval ([C-05](constraints.md)) | Load test (S092) |
| QA-03 | Availability | API 99.5 % monthly (about 3.6 h downtime) | Single region, Multi-AZ database, two API tasks; no multi-region ([availability.md](../reliability/availability.md)) | CloudWatch SLO dashboard |
| QA-04 | Recoverability | RPO 5 min, RTO 4 h after region loss; RPO 24 h, RTO 24 h after losing the AWS account | PITR, cross-region copy, nightly off-provider dump ([disaster-recovery.md](../reliability/disaster-recovery.md)) | Quarterly restore drill (S096) |
| QA-05 | Data residency | All personal data at rest in EU regions | AWS eu-central-1 and eu-west-1; Azure EU region; EU processors only ([P-04](../principles/architecture-principles.md)) | Processor register in the DPIA (S100) |
| QA-06 | Payment security | PCI DSS SAQ-A scope only; no card data on Hopin systems | Card entry in Stripe SDKs only ([ADR 7](../decisions/0007-stripe-connect-payments.md)) | Stripe SAQ-A attestation |
| QA-07 | Accessibility | WCAG 2.1 AA on web; platform accessibility basics on mobile | Accessible component library in `packages/ui` | Automated and manual audit before launch |
| QA-08 | Cost | Idle production ≤ ~150 EUR/month before real traffic | Small instance sizes, NAT removal lever, dev scale-to-zero ([deployment-architecture.md](../deployment/deployment-architecture.md#cost)) | AWS Budgets (S019), cost review (S102) |
| QA-09 | Charge correctness | 0 duplicate charges; every capture equals the taxi-meter amount | Idempotency keys; capture from meter data ([C-02](constraints.md)) | Nightly Stripe reconciliation (S044) |
| QA-10 | Detection | A page-worthy failure alerts the operator within 5 min | Alarms in [observability-architecture.md](../observability/observability-architecture.md) | Alert test during drills |
| QA-11 | Auditability | Every ride state change and admin action traceable for 2 years | Append-only `ride_events` and `audit_log` | Dispute and refund walkthrough |

## Scenario example

```text
Source:        Passenger app
Stimulus:      Sends the same ride request twice after a network timeout
Environment:   Normal operation
Response:      The second request returns the first ride; one card authorisation only
Measure:       0 duplicate rides or authorisations per month (QA-09)
```
