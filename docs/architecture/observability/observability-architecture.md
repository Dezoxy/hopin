# Observability Architecture

Target: [QA-10](../requirements/quality-attributes.md), page-worthy failures alert within 5 minutes. Alert definitions will live in Terraform (plan step S090); this page explains the strategy.

| Signal | Tool | Retention | Notes |
|---|---|---|---|
| Logs | pino JSON → CloudWatch Logs | 30 days dev, 90 days prod | Personal data redacted at the logger ([data-classification.md](../security/data-classification.md)) |
| Metrics | CloudWatch: ECS, ALB, RDS, Redis defaults plus custom | 15 months | Custom: `match_latency_ms`, `offers_per_ride`, `ws_connected_drivers`, `quote_to_request_rate`, `payment_capture_failures` |
| Traces | OpenTelemetry in NestJS → X-Ray | 30 days | Trace ID written into every log line |
| App crashes | Sentry, EU region | 90 days | EAS Update rollouts watched against crash-free rate |
| Audit | `ride_events`, `audit_log` in PostgreSQL | 2 years | [QA-11](../requirements/quality-attributes.md) |

## Page-worthy alerts

| Alert | Threshold |
|---|---|
| API 5xx rate | > 2 % for 5 min |
| Match latency p95 | > 5 s ([QA-01](../requirements/quality-attributes.md)) |
| Connected drivers drop | > 50 % in 5 min |
| RDS free storage | < 15 % |
| Nightly backup | Missing |
| Stripe webhook failures | > 0 in 10 min |
| Driver alarm | Any, immediately ([C-06](../requirements/constraints.md)) |

Alerts go through SNS to phone and email. A static status page on CloudFront is updated by hand at MVP.

## Detection gaps

- No synthetic monitoring of the ride flow yet; add with the first staging deploy.
- The solo operator is the only responder ([RISK-004](../risks/architecture-risks.md)).
