# 13. The operator reads partner data only through time-boxed partner grants

Date: 2026-09-19

## Status

Accepted

## Context

The platform operator can technically read every partner's rides and passengers. Hopin and each partner are joint controllers for partner rides ([ADR 11](0011-joint-controllers-with-partners.md)), and partners are asked to trust Hopin with their customer base. A stolen operator session would expose every partner at once ([T-18](../security/threat-model.md#tb-5-operator-privileged-access)).

## Decision drivers

- Least privilege ([P-03](../principles/architecture-principles.md)).
- Partners must be able to trust the platform with their passengers.
- Support cases must still be solvable in hours, not days.

## Considered options

1. Full access, every read audited.
2. Aggregated metrics by default; detail only through a time-boxed grant issued by the partner.
3. No routine access; break-glass with two-step approval only.

## Decision

We will use option 2. By default the operator sees only aggregated, non-personal metrics per partner. To read one partner's detailed data, the partner issues a grant from its dispatch console, limited to that partner and to a few hours. Row-level security enforces the grant like any other tenant scope ([ADR 9](0009-hybrid-multi-tenancy.md)). Every read under a grant is written to the audit log and visible to the partner. A break-glass path with the escrowed credentials remains for incidents where the partner cannot respond.

## Consequences

Positive:

- A stolen operator session in the application cannot read partner passengers without an active grant. The database owner and AWS administrator credentials still bypass row-level security; they are break-glass only, with MFA and CloudTrail ([T-21](../security/threat-model.md#tb-5-operator-privileged-access)).
- A concrete selling point: partners control who sees their customers.

Negative / accepted trade-offs:

- Support waits for a grant; a partner offline at night delays diagnosis.
- Grants add a permission type the tenancy layer and console must implement and test.

## Risks

- Break-glass misuse; mitigated by the audit log and partner notification.

## Related

- Requirements: [QA-12](../requirements/quality-attributes.md).
- Other ADRs: [9. Hybrid multi-tenancy](0009-hybrid-multi-tenancy.md), [11. Joint controllers](0011-joint-controllers-with-partners.md).
