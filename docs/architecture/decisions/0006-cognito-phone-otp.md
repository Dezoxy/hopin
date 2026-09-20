# 6. Use Amazon Cognito with SMS one-time codes for sign-in

Date: 2026-09-19

## Status

Proposed

## Context

Passengers and drivers sign in with a phone number. The operator needs an admin
role. Personal data must stay in the EU.

## Decision drivers

- Phone-first sign-in.
- Native to the primary cloud (ADR 1).
- No per-user fee at MVP scale.

## Considered options

1. Amazon Cognito user pool with SMS codes.
2. Auth0 or Clerk.

## Decision

We propose one Cognito user pool in eu-central-1 with groups for passenger,
driver, admin and partner, and a tenant claim ([ADR
9](0009-hybrid-multi-tenancy.md)). The API validates Cognito-issued tokens.
Drivers additionally bind a device key at onboarding; a new phone needs partner
approval (threat model
[T-02](../security/threat-model.md#tb-1-internet-to-edge), added 2026-09-19).

## Consequences

Positive:

- Managed, in-region, cheap at low volume.

Negative / accepted trade-offs:

- Weaker developer experience than Auth0 or Clerk.
- Users cannot be exported with password hashes; phone sign-in makes that moot.
- SMS cost and delivery in Hungary need watching.

## Risks

- SMS cost and deliverability (plan Part G).

## Related

- Architecture views: Backend.
