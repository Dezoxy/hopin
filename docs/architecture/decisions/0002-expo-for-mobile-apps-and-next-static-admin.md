# 2. Build the passenger and driver apps with Expo and the admin with a Next.js static export

Date: 2026-09-19

## Status

Accepted

## Context

Hopin needs a passenger app on iOS, Android and the web, a driver app on iOS and Android, and an admin website. One developer maintains all of them.

## Decision drivers

- One language across apps and backend.
- A passenger web target without a separate codebase.
- No native build pipelines to maintain by hand.

## Considered options

1. React Native with Expo for both apps, Next.js for admin.
2. Flutter for all three surfaces.
3. Native Swift and Kotlin plus a separate web app.

## Decision

We will build the passenger and driver apps with React Native and Expo, using EAS for builds, store submission and over-the-air updates. The passenger web target comes from the same Expo codebase.

The admin is a Next.js app built as a static export and served from the CDN. All data comes from the Hopin API. This corrects the first plan draft, which relied on server components; those would need a separate server runtime.

## Consequences

Positive:

- TypeScript end to end, with shared types and validation schemas.
- The passenger web app is nearly free.

Negative / accepted trade-offs:

- Background location in the driver app depends on Expo modules and platform rules.
- The admin cannot render on the server; every page calls the API from the browser.

## Risks

- App store review of background location (plan Part G).

## Related

- Requirements: plan Part A2.
- Architecture views: Clients.
- Other ADRs: [3. NestJS and PostgreSQL](0003-nestjs-postgresql-postgis.md).
