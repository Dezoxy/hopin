# Hopin thin slice

A small running cut of the Hopin API (plan step S123): request a ride, match the nearest free taxi, match once, publish the MATCHED event through the transactional outbox, and stream the driver's position. It exists to turn quality targets into measurements; results are in [the evidence report](../docs/architecture/evidence/s123-slice-results.md).

It follows the architecture: NestJS ([ADR 3](../docs/architecture/decisions/0003-nestjs-postgresql-postgis.md)), PostgreSQL with row-level security per tenant ([ADR 9](../docs/architecture/decisions/0009-hybrid-multi-tenancy.md)), Redis GEO and Socket.IO with the Redis adapter ([ADR 5](../docs/architecture/decisions/0005-redis-socketio-realtime.md)), and the outbox pattern ([ADR 12](../docs/architecture/decisions/0012-payment-capture-workflow.md)). Components map to the **ApiRideFlow** view.

## Deliberately left out

| Production design | In the slice |
|---|---|
| Cognito tokens with a tenant claim | Identity headers and socket auth fields, validated but trusted |
| Road ETAs with traffic (Mapbox Matrix, C-04) | Straight-line distance at 25 km/h |
| Offer timeouts as durable timers | In-memory timers: one API instance only |
| PostGIS service areas | Plain PostgreSQL; no service-area check |
| Payments, Step Functions, arrival and completion | Not included |

## Run it

```bash
docker compose up -d --wait
cp .env.example .env && set -a && . ./.env && set +a
pnpm install
pnpm migrate
pnpm test          # unit, integration and end-to-end tests
pnpm build && pnpm start
```

Load test, with the API running in another shell:

```bash
BASE_URL=http://localhost:3000 pnpm load
```

Tune it with `DRIVERS`, `RIDES_PER_MIN` and `DURATION_S`. Results are written to `load/results/`.

The values in `.env.example` and `docker-compose.yml` are for local development only.
