# Data Classification

Retention periods are targets; the retention for dispatch order records waits on the lawyer ([A-02](../requirements/assumptions.md), memo open question 4).

| Data | Classification | Where it lives | Retention | Notes |
|---|---|---|---|---|
| Phone number | Personal | Cognito, Hopin Database | Life of account + 30 days | Login identifier |
| Name, profile | Personal | Hopin Database | Life of account + 30 days | |
| Live driver position | Personal, location | Realtime Cache | Minutes (overwritten) | Required by [C-05](../requirements/constraints.md) |
| Driver location history | Personal, location | Hopin Database | 90 days, then aggregated | DPIA scope ([C-09](../requirements/constraints.md)) |
| Ride and ride events (pickup, drop-off, route points) | Personal, location | Hopin Database | 2 years | Disputes, tax, audit ([QA-11](../requirements/quality-attributes.md)) |
| Driver documents (ID, licence, permits) | Personal, **high sensitivity** | Document Store (S3), Azure copy | While the driver is active + legal minimum | Never public; presigned access only |
| Payment references (Stripe IDs, amounts) | Confidential, financial | Hopin Database | 8 years | Accounting duty |
| Meter receipt photos | Personal, financial evidence | Document Store (S3) | 1 year, or until a dispute closes | Only when the typed amount exceeds the tariff check by 15 % ([T-09](threat-model.md#tb-2-edge-to-private-network)) |
| Payment workflow history (ride ID, amounts, states) | Confidential, financial | AWS Step Functions | 90 days | [ADR 12](../decisions/0012-payment-capture-workflow.md) |
| AI case files and drafts (complaint text, ride events, draft reply) | Personal | Sent to Amazon Bedrock in eu-west-1; Bedrock may keep it for abuse detection in that region, never shared with the model provider; not stored by Hopin until staff send the reply | Request only; the sent reply follows the ride's 2 years | Roles instead of IDs, no contact details ([T-31](threat-model.md#tb-7-hopin-to-model-providers)); logs keep outcome and event IDs only |
| AI evaluation cases | Public, synthetic | This repository (`slice/eval/cases.json`) | Indefinite | Must never contain real data ([T-29](threat-model.md#tb-7-hopin-to-model-providers)) |
| Card numbers, CVC | **Never stored** | — | — | Stripe SDK only ([QA-06](../requirements/quality-attributes.md)) |
| Ratings and comments | Personal | Hopin Database | Life of account | |
| Trip-share token | Secret | Hopin Database | Until expiry (2 h after the ride) or revoked | |
| Admin audit log | Confidential | Hopin Database | 2 years | |
| Application logs | Internal | CloudWatch Logs | 30 days dev, 90 days prod | No personal data in messages |
| Traces | Internal | X-Ray | 30 days | Ride and user IDs only as attributes |
| Crash reports | Internal | Sentry (EU region) | 90 days | Scrub phone numbers and locations |

## Rules

- Personal data at rest only in EU regions ([QA-05](../requirements/quality-attributes.md)).
- Logs carry ride and user IDs, never names, phone numbers or coordinates.
- Account deletion: soft delete, personal data scrubbed after 30 days; financial and ride records kept pseudonymised for their legal retention.
- Data export: asynchronous job, presigned link valid 24 h.
