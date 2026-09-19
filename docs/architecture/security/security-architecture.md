# Security Architecture

Planned controls for the MVP. Nothing is deployed; each control names the plan step that builds it. Boundaries are in [trust-boundaries.md](trust-boundaries.md); data handling is in [data-classification.md](data-classification.md). See the **Security** view in the model.

## Authentication and authorisation

| Who | Authenticates with | Authorised by | Step |
|---|---|---|---|
| Passenger, driver | Phone number and SMS one-time code (Cognito) | Cognito group in the JWT, checked by a NestJS guard on every route and socket namespace | S026 |
| Operator (admin web) | Same, plus the `admin` group | Admin group plus a WAF IP allowlist on the admin site; every admin action written to `audit_log` | S026, S080, S037 |
| Trip-share viewer | Nothing; holds a share token | Token is random, scoped to one ride, expires 2 h after completion, revocable | S035 |
| Stripe | Webhook signature | Signature check before any processing; idempotent handler | S044 |
| Hopin API to AWS services | ECS task role | Least-privilege IAM policy per task | S081 |
| Backup exporter to Azure | Write-only storage credential from Secrets Manager | Container-scoped, no delete permission; immutability policy blocks overwrite | S094 |
| CI/CD | GitHub OIDC | Per-environment roles; production role only from `main` with approval | S015 |
| Humans in the cloud consoles | IAM Identity Center or Entra ID, MFA required | Permission sets; no IAM users; root sealed | S011, S012 |

Resource ownership is checked in the API, not only the role: a passenger can read only their own rides, a driver only rides offered to or assigned to them.

## Secrets

- **Runtime source:** AWS Secrets Manager holds database credentials, Stripe keys, Mapbox server token, Cognito app secrets and the Azure credential. Tasks read them at start through task-definition secrets.
- **Rotation:** database credentials rotate automatically; third-party keys rotate manually on a calendar reminder and after any suspected exposure.
- **Escrow:** Azure Key Vault holds the dump encryption key and break-glass credentials (AWS break-glass user, Stripe restricted key) with purge protection and soft delete ([ADR 1](../decisions/0001-aws-primary-azure-for-off-provider-recovery.md)).
- **Client-side tokens:** the Mapbox public token is URL-restricted; no other secret ships in an app bundle.

## Encryption

- In transit: TLS 1.2+ everywhere, ACM certificates, TLS to RDS and Redis.
- At rest: KMS customer-managed keys for RDS, S3, Secrets Manager, CloudWatch Logs; Azure storage encryption plus client-side encryption of dumps with the escrowed key.

## Network

- Private subnets for ECS tasks, RDS and Redis. Only the load balancer and NAT sit in public subnets.
- VPC endpoints for S3, ECR, Secrets Manager and CloudWatch, so tasks reach AWS APIs without NAT.
- Security groups allow only load balancer → API, API → database and cache.

## Edge

- AWS WAF managed core rule set on CloudFront, the API load balancer and the Cognito user pool.
- Rate limits on quote and ride creation at the load balancer and on sign-in at Cognito.
- Shield Standard.

## Application

- zod validation on every input ([engineering-standards.md](../principles/engineering-standards.md)).
- Driver documents uploaded through presigned S3 URLs with type and size limits; never public.
- Idempotency keys on ride and payment creation ([QA-09](../requirements/quality-attributes.md)).

## Supply chain

- Dependabot, `pnpm audit` and Trivy image scans in CI; ECR scan on push; GitHub secret scanning and push protection on this public repository.

## Detection

- CloudTrail organisation trail, GuardDuty, Security Hub CIS benchmark, AWS Config rules (no public S3, encrypted RDS, no open SSH).
- Microsoft Defender for Storage and Key Vault on the Azure side.

## Open items

- Threat model (STRIDE) for the ride lifecycle, payments and onboarding: plan step S099.
- OWASP ASVS level 1 review: plan step S098.
