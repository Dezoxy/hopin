# Threat Model

STRIDE analysis of the planned design, plan step S099, 2026-09-19. It covers the trust boundaries in [trust-boundaries.md](trust-boundaries.md) and the flows in the Security, PartnerIsolation, TripShare, PaymentCapture, LocationData and OffProviderRecovery views. Nothing is built, so every control is **planned**; each names the plan step that builds it or the risk that tracks what is left.

**STRIDE:** Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.

## Founder decisions

Four threats had a real trade-off. The founder chose:

| Threat | Decision | Rejected alternatives |
|---|---|---|
| [T-09](#tb-2-edge-to-private-network) driver-entered meter amount inflated | Check against the official tariff over the GPS route; above 15 % tolerance, require a photo of the meter receipt before capture and flag it to the partner | Check only (weak evidence); photo on every ride (friction, more personal data) |
| [T-02](#tb-1-internet-to-edge) driver account taken over or shared | SMS code plus a device key bound at onboarding; a new phone needs partner approval | Selfie check (biometric special-category data); SMS only (SIM swap) |
| [T-18](#tb-5-operator-privileged-access) operator reads partner data | Aggregates by default; reading a partner's data needs a time-boxed grant from that partner, fully audited ([ADR 13](../decisions/0013-operator-access-by-partner-grant.md)) | Full audited access; break-glass only |
| [T-05](#tb-1-internet-to-edge) forwarded trip-share link | Keep as designed: random token, 2-hour expiry after the ride, revocable, rate-limited, current position only | Viewer code; position only after pickup |

## TB-1 Internet to edge

| ID | STRIDE | Threat | Control | Status |
|---|---|---|---|---|
| T-01 | S | Attacker forges a Stripe webhook to mark payments captured | Signature check before any processing; idempotent by event ID ([ADR 12](../decisions/0012-payment-capture-workflow.md)) | Planned, S044 |
| T-02 | S | Driver account taken over by SIM swap, or shared with an unlicensed person | SMS code plus device key; new device needs partner approval. Who is driving stays the partner's licence duty | Planned, S026; residual in [RISK-018](../risks/architecture-risks.md) |
| T-03 | S | Passenger account takeover to ride on someone else's card | SMS code; Stripe 3-D Secure where required; new device logged | Planned, S026, S042 |
| T-04 | D | Flooding quote, ride or sign-in endpoints | WAF rate limits on the load balancer and Cognito; Shield Standard | Planned, S086 |
| T-05 | I | Forwarded trip-share link reveals a passenger's live position | Random token, expiry, revocation, rate limit, current position only (founder decision) | Planned, S035; residual accepted |
| T-06 | T | Tampered app sends forged API calls | Server validates every input with zod; the app is never trusted for state or price | Planned, S038 |

## TB-2 Edge to private network

| ID | STRIDE | Threat | Control | Status |
|---|---|---|---|---|
| T-07 | E | A user calls another user's resources by guessing IDs | Ownership check on every route plus row-level security; random IDs | Planned, S037, S025 |
| T-08 | T | Driver fakes GPS to win offers or inflate the route | Server plausibility on speed and jumps; Android mock-location flag recorded | Planned, S033 |
| T-09 | T | Driver types an inflated meter amount | Tariff-over-route check, photo above 15 % tolerance, partner flag (founder decision) | Planned, S113 |
| T-10 | R | Driver or passenger denies an action (cancellation, arrival, alarm) | Append-only ride events with actor, time and position ([QA-11](../requirements/quality-attributes.md)) | Planned, S032 |
| T-11 | D | Socket flood from a compromised client exhausts API tasks | Per-connection rate limits; connection caps per user; autoscaling | Planned, S033 |

## TB-3 API to data stores

| ID | STRIDE | Threat | Control | Status |
|---|---|---|---|---|
| T-12 | I | Missing tenant context leaks one partner's rows to another | Row-level security enforced by the database; role cannot bypass it; cross-tenant tests in CI ([ADR 9](../decisions/0009-hybrid-multi-tenancy.md)) | Planned, S025; [RISK-015](../risks/architecture-risks.md) |
| T-13 | I | Database credentials leak from code or logs | Secrets Manager, automatic rotation, no secrets in logs | Planned, S017 |
| T-14 | T | SQL injection | Parameterised queries through the ORM; no string-built SQL | Planned, S024 |
| T-15 | I | Personal data in logs or traces | Redaction at the logger; IDs only ([data classification](data-classification.md)) | Planned, S023 |

## TB-4 AWS to Azure

| ID | STRIDE | Threat | Control | Status |
|---|---|---|---|---|
| T-16 | T | Attacker in AWS overwrites or deletes the off-provider backups | Write-only credential; immutability policy | Planned, S094; [RISK-010](../risks/architecture-risks.md) |
| T-17 | I | Attacker in AWS reads the backups | Dumps encrypted with a key held only in Azure Key Vault | Planned, S094 |

## TB-5 Operator privileged access

| ID | STRIDE | Threat | Control | Status |
|---|---|---|---|---|
| T-18 | I | Operator, or a stolen operator session, reads partner passengers and rides | Aggregates only by default; partner-issued time-boxed grant for detail; every read audited ([ADR 13](../decisions/0013-operator-access-by-partner-grant.md)) | Planned, S037, S073 |
| T-19 | E | Operator console compromised through XSS | Static export with strict Content-Security-Policy; no inline scripts; WAF IP allowlist | Planned, S080 |
| T-20 | R | Admin action without trace (refund, block, approval) | Audit log of every admin action with actor and reason | Planned, S037 |
| T-21 | S | Cloud console takeover | Identity Center and Entra ID with MFA; no IAM users; break-glass escrowed in Azure | Planned, S011, S095 |

## TB-6 Hopin to regulators and partners

| ID | STRIDE | Threat | Control | Status |
|---|---|---|---|---|
| T-22 | I | Data sent to BKK or the invoicing provider beyond what the law requires | Adapter sends only the fields the rule names; reviewed in the DPIA | Planned, S112, S100 |
| T-23 | S | Forged meter data if the meter integration trusts the phone | Decide with the meter vendor in S113; until then T-09 applies | Open, S113 |

## Delivery and supply chain

| ID | STRIDE | Threat | Control | Status |
|---|---|---|---|---|
| T-24 | T | Malicious dependency or image | Dependabot, `pnpm audit`, Trivy, image scan on push; lockfile committed | Planned, S087 |
| T-25 | E | Stolen CI credentials deploy to production | OIDC roles only; production role only from `main` with approval; required checks | Planned, S015; in place for the docs repo |
| T-26 | I | Secret committed to this public repository | Gitleaks in CI on full history; GitHub push protection | In place |

## What this model does not cover

- Physical safety of passengers and drivers beyond the alarm flow.
- Fraud patterns that need data: collusion between drivers and passengers, card testing. Revisit with real traffic.
- The mobile operating systems and the certified meter's own security.

Review this model when a trust boundary, an entry point or an identity mechanism changes.
