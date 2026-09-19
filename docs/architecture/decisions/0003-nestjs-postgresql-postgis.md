# 3. Use NestJS with PostgreSQL and PostGIS as the system of record

Date: 2026-09-19

## Status

Accepted

## Context

The backend must handle ride state, payments, service-area polygons and location history. Rides and payments need transactional integrity. Geography queries are core to quoting and matching.

## Decision drivers

- Same language as the apps (see ADR 2).
- Relational integrity for rides and money.
- Native geography types and indexes.

## Considered options

1. Node.js with NestJS, PostgreSQL with PostGIS.
2. Go with PostgreSQL and PostGIS.
3. C# .NET with PostgreSQL and PostGIS.

## Decision

We will write the API in TypeScript on NestJS and keep all durable state in PostgreSQL 16 with PostGIS, hosted on Amazon RDS. Every ride state change is appended to a ride-events table.

## Consequences

Positive:

- Shared types between API and apps.
- Service areas and distance checks run in the database.

Negative / accepted trade-offs:

- Node.js is weaker for CPU-heavy work; matching must stay I/O-bound.
- Hot location data cannot live in PostgreSQL alone (see ADR 5).

## Risks

- None tracked yet.

## Related

- Requirements: plan Part A6, Part B4.
- Architecture views: Backend, RideRequest.
- Other ADRs: [5. Redis for realtime](0005-redis-socketio-realtime.md).
