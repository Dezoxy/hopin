# 5. Use Redis and Socket.IO for live locations and realtime updates

Date: 2026-09-19

## Status

Proposed

## Context

Online drivers report a position every few seconds. Matching needs the nearest
online drivers within milliseconds. Passengers must see the driver move in near
real time, across several API tasks.

## Decision drivers

- Offer sent within 2 s of a request (plan A7).
- Driver position at most 3 s old on screen (plan A7).
- Several API tasks must share socket rooms.

## Considered options

1. Redis GEO index, Socket.IO with the Redis adapter, BullMQ on the same Redis.
2. PostgreSQL only, writing every position update.

No other options were recorded.

## Decision

We propose keeping live driver positions only in Redis, using Socket.IO with the
Redis adapter for fan-out, and BullMQ on the same Redis for timers and jobs.
PostgreSQL receives batched location history for disputes.

## Consequences

Positive:

- Fast nearest-driver search and cheap fan-out.
- One extra component serves three needs.

Negative / accepted trade-offs:

- Redis is not backed up. Losing it drops live positions until drivers
  reconnect, and loses queued jobs.

- Budapest requires automatic selection by road distance and traffic
  ([C-04](../requirements/constraints.md)). Redis GEO can only pre-filter
  candidates; the final choice needs road ETAs, for example from a routing
  matrix API.

## Risks

- Queued jobs lost on a Redis failure; jobs must be idempotent and re-derivable
  from the database.

## Related

- Requirements: plan Part A7.
- Architecture views: Backend, RideRequest.
