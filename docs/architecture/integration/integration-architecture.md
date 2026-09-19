# Integration Architecture

How Hopin talks to its clients and to outside systems. Exact contracts live in `/api` (OpenAPI, plan step S006) and `packages/shared` (zod event schemas); this page explains the behaviour.

## Client interfaces

| Interface | Style | Auth | Failure handling |
|---|---|---|---|
| REST `/v1` | Synchronous HTTPS/JSON | Cognito JWT | Idempotency keys on creates; standard error envelope; clients retry with backoff |
| Realtime | Socket.IO over WSS, Redis adapter | Cognito JWT on connect | At-most-once delivery; on reconnect, clients re-read state over REST. See [event-catalog.md](event-catalog.md) |
| Trip share | HTTPS polling of `share/:token` | Share token | Expired or revoked token returns 404 |

## External systems

| System | Direction | Contract | Auth | Failure handling |
|---|---|---|---|---|
| Stripe | Out: charges, refunds, payouts. In: webhooks | Stripe API, signed webhooks | Restricted API key; webhook signature | Idempotency keys; webhook handler idempotent; nightly reconciliation (S044) |
| Mapbox | Out: geocoding, directions, matrix | Mapbox APIs | Server token; URL-restricted public token for tiles | Cache geocoding; if routing fails, matching falls back to nearest by straight line and flags the ride. **Budapest requires road distance ([C-04](../requirements/constraints.md)), so the fallback must be reviewed with the lawyer.** |
| Expo Push | Out: notifications | Expo push API | Access token | Retry; drop invalid device tokens |
| Cognito | Sign-in, token validation | OIDC/JWKS | — | Cached JWKS; sign-in unavailable during a Cognito outage |
| Azure Blob and Key Vault | Out: nightly backups | Azure SDK | Write-only credential | Job fails loudly; alarm if no new blob in 26 h |
| BKK real-time feed (planned) | Out: position and meter start/stop | Not yet known | Not yet known | Plan step S112, [C-05](../requirements/constraints.md) |
| Taxi meter (planned) | In: final meter amount | Not yet known | Not yet known | Plan step S113, [C-02](../requirements/constraints.md) |
| Invoicing provider (planned) | Out: fee invoices | Provider API | API key | Plan step S047, [C-08](../requirements/constraints.md) |
