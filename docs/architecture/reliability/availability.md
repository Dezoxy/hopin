# Availability

Target: [QA-03](../requirements/quality-attributes.md), 99.5 % monthly for the API. Nothing is measured yet.

| Failure | Customer impact | Detection | Degraded behaviour | Recovery |
|---|---|---|---|---|
| One API task crashes | Some sockets reconnect | ALB health checks | Other task serves; clients reconnect and re-read state | ECS replaces the task |
| One AZ lost | Brief errors | ALB, RDS events | One task, RDS fails over to standby | Automatic |
| Redis lost | Live positions and matching pause; queued jobs lost | Alarm on connection errors | Requests fail fast; drivers re-report within seconds | New node; jobs re-derived from the database ([RISK-008](../risks/architecture-risks.md)) |
| Database lost beyond Multi-AZ | Service down | RDS events, 5xx alarm | Maintenance page | PITR restore ([disaster-recovery.md](disaster-recovery.md)) |
| Region lost | Service down | Regional health | Status page | Restore in eu-west-1, RTO 4 h |
| Stripe outage | New rides cannot authorise | Stripe error rate | Rides blocked with a clear message; in-progress rides captured later | Automatic retry |
| Mapbox outage | Estimates and matching degrade | Mapbox error rate | Matching fallback per [integration-architecture.md](../integration/integration-architecture.md) | Automatic |
| Expo Push outage | Missed background notifications | Error rate | In-app sockets still deliver | Automatic |
| Cognito outage | No new sign-ins | Error rate | Signed-in users continue until token expiry | AWS |
| Platform down at night, operator asleep | Partners cannot dispatch through Hopin; the law still requires them to dispatch | Page to the operator, possibly unanswered | Partners fall back to phone dispatch, a contract requirement ([RISK-022](../risks/architecture-risks.md)) | Operator recovers in the morning |

A replica is not proof of availability: every row above must be exercised once in a drill before launch (plan step S096).
