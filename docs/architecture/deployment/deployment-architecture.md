# Deployment Architecture

Planned; nothing is deployed. See the **ProductionCore**, **AwsBackups** and
**AzureRecovery** views. Terraform in `/infra` will be the source of truth for
every setting once it exists (plan steps S013–S016).

## Placement

| Component | Runs on | Instances (prod) | Failure domain |
|---|---|---|---|
| Hopin API | ECS Fargate in private subnets, 2 AZs | 2 tasks, CPU target tracking | One AZ loss leaves one task |
| Backup Exporter | ECS scheduled task | 1 nightly run | Retried next night; alarm on failure |
| Hopin Database | RDS PostgreSQL 16, Multi-AZ | Primary + standby | Automatic AZ failover, about 1–2 min |
| Realtime Cache | ElastiCache Redis | 1 node | Loss drops live positions until drivers re-report ([RISK-008](../risks/architecture-risks.md)) |
| Document Store | S3 | Regional | Regional service |
| Payment Workflow | AWS Step Functions (Standard) | Managed, regional | Regional service; not available in the Azure restore ([ADR 12](../decisions/0012-payment-capture-workflow.md)) |
| Web builds (passenger web, admin, trip share) | CloudFront + S3 | Global edge | Edge service |
| Load balancer + WAF | ALB | Regional, multi-AZ | Regional service |

Shared failure domain: everything live is in **eu-central-1**. A regional outage
stops the service; recovery follows
[disaster-recovery.md](../reliability/disaster-recovery.md).

## Delivery

| Trigger | What happens |
|---|---|
| Pull request | Lint, typecheck, unit and integration tests, Trivy, docs consistency, Structurizr check, `terraform plan` for touched environments |
| Merge to `main` | Build images, push to ECR, deploy `dev`, smoke tests |
| Tag `v*-rc` | Deploy `staging`; EAS build to TestFlight and Play internal |
| Tag `v*` | Manual approval, rolling deploy to `prod` with ECS circuit breaker; EAS Submit; EAS Update to production channel only after the store build is live |
| Rollback | Previous ECS task definition; republish previous EAS Update |

## Cost

Rough monthly production cost at idle to light traffic, EUR. Target is [QA-08](../requirements/quality-attributes.md).

| Item | Estimate |
|---|---|
| ECS Fargate (2 × 0.5 vCPU / 1 GB) | ~35 |
| RDS PostgreSQL db.t4g.small Multi-AZ | ~60 |
| ElastiCache cache.t4g.micro | ~15 |
| NAT Gateway (1) | ~35 |
| ALB | ~20 |
| CloudFront, S3, Route 53, CloudWatch | ~10 |
| AWS Backup + cross-region copy | ~5 |
| Step Functions (~10 transitions per ride) | < 5 |
| Azure Blob (cool, ~50 GB) + Key Vault | ~5 |
| Sentry, Mapbox, Expo (free tiers at MVP) | 0–30 |
| SMS one-time codes | usage-based, ~0.05 per message |
| **Total** | **~190–220** |

This is above the QA-08 target, so production runs single-AZ with no NAT (VPC
endpoints only) until the first paying partner, at about 120 EUR a month, and
moves to this shape then (founder decision, 2026-09-19). Three-year costs across
scenarios, including Mapbox, people and one-off costs, are in the [three-year
cost model](../../business/three-year-cost-model.md).
