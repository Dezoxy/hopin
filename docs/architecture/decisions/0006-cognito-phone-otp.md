# 6. Use Amazon Cognito with SMS one-time codes for sign-in

Date: 2026-09-19

## Status

Proposed

## Context

Passengers and drivers sign in with a phone number. The operator needs an admin role. Personal data must stay in the EU.

## Decision drivers

- Phone-first sign-in.
- Native to the primary cloud (ADR 1).
- No per-user fee at MVP scale.

## Considered options

1. Amazon Cognito user pool with SMS codes.
2. Auth0 or Clerk.

## Decision

We propose one Cognito user pool in eu-central-1 with groups for passenger, driver and admin. The API validates Cognito-issued tokens.

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
