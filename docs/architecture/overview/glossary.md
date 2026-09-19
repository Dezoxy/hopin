# Glossary

| Term | Meaning |
|---|---|
| Quote | A fare calculated before booking, valid for about two minutes. |
| Offer | A ride proposed to one driver, who can accept or decline within a timeout. |
| Ride event | An append-only record of one ride state change, with actor, time and position. |
| Service area | The map polygon where Hopin accepts rides. |
| Trip share | A public link that shows a ride's live position until it expires or is revoked. |
| Off-provider backup | A copy of data held outside AWS, in Azure, so it survives losing the AWS account. |
| Escrow | Keeping a copy of a secret somewhere safe for emergency use. |
| Break-glass | Emergency credentials used only when normal access is lost. |
| PITR | Point-in-time recovery: restoring a database to any moment within a retention window. |
| RPO / RTO | Recovery point objective (how much data may be lost) and recovery time objective (how long recovery may take). |
| EAS | Expo Application Services: cloud builds, store submission and over-the-air updates. |
| Tenant | One dispatch partner, or the Hopin brand, whose data is isolated from all others ([ADR 9](../decisions/0009-hybrid-multi-tenancy.md)). |
| Row-level security (RLS) | A PostgreSQL feature that filters every query by a policy, here the current tenant. |
| Transactional outbox | A table written in the same transaction as a state change, so the change and the event about it commit together ([ADR 12](../decisions/0012-payment-capture-saga-with-outbox.md)). |
| Saga | A sequence of local steps with compensations instead of one distributed transaction. |
| Idempotency key | A key that makes repeating a request return the first result instead of acting twice. |
| Joint controllers | Two parties that decide together why and how personal data is processed (GDPR Article 26). |
