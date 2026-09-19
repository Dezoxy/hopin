# Hopin thin slice

A small running cut of the Hopin API (plan step S123): request a ride, match the nearest free taxi, match once, publish the MATCHED event through the transactional outbox, and stream the driver's position. It exists to turn quality targets into measurements; results are in [the evidence report](../docs/architecture/evidence/s123-slice-results.md).

It follows the architecture: NestJS ([ADR 3](../docs/architecture/decisions/0003-nestjs-postgresql-postgis.md)), PostgreSQL with row-level security per tenant ([ADR 9](../docs/architecture/decisions/0009-hybrid-multi-tenancy.md)), Redis GEO and Socket.IO with the Redis adapter ([ADR 5](../docs/architecture/decisions/0005-redis-socketio-realtime.md)), and the outbox pattern ([ADR 12](../docs/architecture/decisions/0012-payment-capture-workflow.md)). Components map to the **ApiRideFlow** view.

## Deliberately left out

| Production design | In the slice |
|---|---|
| Cognito tokens with a tenant claim | Identity headers and socket auth fields, validated but trusted. The app refuses to start unless `SLICE_INSECURE_IDENTITY=true`, so it cannot be run as the real API by mistake |
| Road ETAs with traffic (Mapbox Matrix, C-04) | Straight-line distance at 25 km/h |
| Offer timeouts as durable timers | In-memory timers: one API instance only |
| PostGIS service areas | Plain PostgreSQL; no service-area check |
| Payments, Step Functions, arrival and completion | Not included |
| Three of the four AI use cases ([ADR 14](../docs/architecture/decisions/0014-ai-assists-staff-read-and-draft-only.md)) | Only the dispute assistant |

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

## AI dispute assistant

A staff member sends a passenger's complaint for one ride, and gets back a summary and a draft reply that cites ride events ([ADR 14](../docs/architecture/decisions/0014-ai-assists-staff-read-and-draft-only.md), **DisputeAssist** view). The draft is never sent automatically.

```bash
curl -X POST localhost:3000/v1/assist/disputes/<rideId>/draft \
  -H 'x-tenant-id: <tenant>' -H 'x-staff-id: <staff>' \
  -H 'content-type: application/json' -d '{"complaint":"The driver was 15 minutes late."}'
```

- **Off by default.** With `ASSIST_PROVIDER=none` the endpoint answers 503. With `ASSIST_PROVIDER=bedrock` it calls Claude on Amazon Bedrock in `BEDROCK_REGION` (EU regions only) with your AWS credentials. There is no API key in the app.
- **What the model sees.** Roles instead of IDs, no emails or phone numbers, and positions rounded to about 1 km ([case-file.ts](src/assist/case-file.ts)).
- **What is rejected.** A draft that cites an unknown event or promises a refund or payment comes back as `rejected`, and staff write the reply themselves.
- **Where real data may go.** Only to a model client on the data plane. The evaluation client cannot be used by the app ([ADR 15](../docs/architecture/decisions/0015-bedrock-for-data-openrouter-for-evaluation.md)).

The tests use a fake model, so they run without AWS or network.

### Evaluation harness

`eval/` scores models on six synthetic cases, including a prompt injection and a Hungarian complaint, with the same checks the app enforces. It runs on OpenRouter and never uses real data.

```bash
pnpm eval --fake
```

```bash
OPENROUTER_API_KEY=... EVAL_MODELS=anthropic/claude-opus-5,anthropic/claude-sonnet-5 pnpm eval
```

The offline mode runs a fake model that fails the injection case, which shows the harness catches it. Results are written to `eval/results/`, which is gitignored. A real run costs money on your OpenRouter account.
