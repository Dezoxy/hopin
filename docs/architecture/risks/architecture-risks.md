# Architecture Risks

Reviewed at the start of each plan phase and after any incident. Owner for all: the founder. Likelihood is a judgement until there is data.

| ID | Risk | Impact | Likelihood | Mitigation | Residual risk | Review trigger |
|---|---|---|---|---|---|---|
| RISK-001 | Budapest dispatch rules (100 M HUF equity, BKK-certified software) block launching Hopin as its own operator | High: no legal launch in Budapest | High | Technology-provider model or another city ([S002 memo](../../compliance/s002-regulatory-memo.md), [A-01](../requirements/assumptions.md)) | Depends on a partner or a smaller market | Plan step S111 |
| RISK-002 | SMS one-time code cost or delivery problems in Hungary | Medium: sign-in friction, cost | Medium | Budget alert on SMS; email code fallback ([A-04](../requirements/assumptions.md)) | Some users fail first sign-in | Plan step S026 |
| RISK-003 | App stores reject background location in the driver app | High: launch delay | Medium | Follow platform guidance from day one; in-app disclosure; demo video ([A-07](../requirements/assumptions.md)) | Review delays | Plan step S105 |
| RISK-004 | Solo operator is the only on-call responder | High: long outages | High | Boring architecture, actionable alerts, short runbooks ([P-01](../principles/architecture-principles.md)) | Nights and holidays uncovered | Before soft launch (S108) |
| RISK-005 | Mapbox ETAs inaccurate in Budapest | Medium: poor matches, disputed estimates | Medium | Compare with Google in S029; estimates labelled as estimates ([A-03](../requirements/assumptions.md)) | Estimate disputes | Plan step S029 |
| RISK-006 | Multi-cloud scope creep | Medium: infrastructure work crowds out product | Medium | Azure only for backup, escrow and cold restore ([ADR 1](../decisions/0001-aws-primary-azure-for-off-provider-recovery.md)) | — | Plan step S110 |
| RISK-007 | Payment fraud and disputes | Medium: money loss | Medium | Stripe Radar, 3-D Secure, ride events as evidence ([QA-11](../requirements/quality-attributes.md)) | Some chargebacks | Plan step S048 |
| RISK-008 | Redis loss drops live positions and queued jobs | Medium: matching pause, missed timers | Low | Jobs idempotent and re-derivable from the database ([ADR 5](../decisions/0005-redis-socketio-realtime.md)) | Seconds of degraded matching | Plan step S092 |
| RISK-009 | Restore paths untested | High: RTO targets are fiction until drilled | High until S096 | Quarterly restore drills ([disaster-recovery.md](../reliability/disaster-recovery.md)) | Low after the first drill | Plan step S096 |
| RISK-010 | Azure upload credential stored in AWS Secrets Manager | Medium: an AWS attacker can write to the backup store | Low | Write-only credential; immutability blocks overwrite and delete ([P-03](../principles/architecture-principles.md)) | Attacker can add junk blobs, not destroy backups | Plan step S094 |
