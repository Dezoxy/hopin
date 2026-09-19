# Hopin — Master Plan

> **Status:** v0.1 — initial plan, 2026-09-19
> **Source of vision:** [hopin-pre-plan.md](./hopin-pre-plan.md)
> **How to use this file:** this is the single living plan. Every step in Part D has an ID (`S001`…). When we start a step, we add a `### S0xx` section under Part E with details, decisions and results, and flip its status in the table. Nothing gets deleted; superseded decisions are struck through with a note.
> **Architecture:** diagrams and decision records live in [architecture/](./architecture/README.md) (Structurizr model + ADRs). This plan owns scope, requirements, roadmap and risks until a concern moves into its own architecture document.

---

## Part A — Product

### A1. Vision

Hopin is a ride-hailing app for short urban trips. Passengers book in a few taps, see the fare before the ride, track the driver live, share the trip with someone they trust, pay in-app and rate the driver afterwards. Tagline: *Hop in. Get there.*

### A2. MVP scope (decided)

| Surface | Platforms | Users |
|---|---|---|
| Passenger app | iOS, Android, Web (same Expo codebase) | Passengers |
| Driver app | iOS, Android | Licensed taxi drivers |
| Admin web | Web (Next.js) | Operator (you) |
| Trip-share page | Public web, tokenized link | Anyone the passenger shares with |
| Backend API + realtime | AWS eu-central-1 | All of the above |

### A3. In scope for MVP

- Phone-number login (OTP) for passengers and drivers.
- Pickup and destination selection on a map with address search.
- Upfront fare quote, valid for a short window.
- Driver matching by proximity, with accept/decline and timeout fallback.
- Live driver location to the passenger before and during the trip.
- Ride lifecycle: requested → matched → arriving → in progress → completed / cancelled.
- In-app card payment (Apple Pay / Google Pay / saved card) via Stripe; tips; cancellation fees.
- Driver payouts via Stripe Connect.
- Trip sharing through a public tracking link.
- Ratings both ways (passenger rates driver; driver rates passenger).
- Driver onboarding with document upload and manual approval in admin.
- Admin: live map, driver approval queue, ride lookup, refunds, fare parameters, service area.
- Push notifications for ride events.
- Receipts by email.

### A4. Explicitly out of scope for MVP (v2 backlog)

- Scheduled / advance rides, ride pooling, multi-stop rides.
- Surge pricing (fare parameters exist, surge multiplier is fixed at 1.0).
- In-app turn-by-turn navigation for drivers (MVP deep-links to Google/Apple/Waze).
- In-app chat (MVP: masked phone call only; chat is a v2 item).
- Promo codes, referral programs, corporate accounts, cash payment.
- Multiple cities / multiple currencies. MVP is one city, HUF only.
- A second running copy of production in Azure (see Part C4 for what Azure *does* do).

### A5. Actors and journeys

**Passenger:** sign up → add payment method → set pickup/destination → see quote → request → wait for match → track driver → ride → pay automatically → rate → (optional) tip. Can cancel before pickup, can share trip at any time.

**Driver:** sign up → upload licence, taxi permit, ID, vehicle documents → wait for approval → go online → receive offer → accept → navigate to pickup → mark arrived → start trip → complete trip → see earnings → get weekly payout.

**Admin:** review driver documents → approve/reject → watch live operations → investigate a ride → issue refund → tune fare parameters and service area → block abusive accounts.

### A6. Ride state machine

```
                 ┌──────────┐
                 │ QUOTED   │  (fare quote, 2 min TTL, no driver yet)
                 └────┬─────┘
                      │ passenger confirms
                 ┌────▼─────┐
        ┌────────│ REQUESTED│────────┐ no driver within N offers / timeout
        │        └────┬─────┘        │
        │ passenger   │ driver       ▼
        │ cancels     │ accepts   NO_DRIVER (terminal)
        │        ┌────▼─────┐
        │        │ MATCHED  │  driver en route to pickup
        │        └────┬─────┘
        │             │ driver taps "arrived"
        │        ┌────▼─────┐
        ├────────│ ARRIVED  │  wait timer starts (cancellation fee after X min)
        │        └────┬─────┘
        │             │ driver taps "start"
        │        ┌────▼──────────┐
        │        │ IN_PROGRESS   │
        │        └────┬──────────┘
        │             │ driver taps "complete"
        │        ┌────▼──────────┐
        │        │ COMPLETED     │ → capture payment → rating window
        │        └───────────────┘
        ▼
   CANCELLED_BY_PASSENGER / CANCELLED_BY_DRIVER (terminal, fee rules apply)
```

Every transition is written to `ride_events` (append-only) with actor, timestamp and GPS position. This is the audit trail for disputes and refunds.

### A7. Non-functional requirements

| Area | Target for MVP | Why |
|---|---|---|
| Match latency | Offer sent to first driver < 2 s after request | Core UX promise |
| Location freshness | Driver position ≤ 3 s old on passenger screen | "Live" must feel live |
| Availability | 99.5 % monthly for API (≈ 3.6 h downtime) | Solo-run, single region, be honest |
| RPO / RTO | RPO 5 min (PITR), RTO 4 h same-region, 24 h cross-cloud | See Part C5 |
| Data residency | All personal data at rest in EU (AWS eu-central-1, Azure West Europe) | GDPR |
| PCI | SAQ-A scope only; card data never touches our servers | Stripe Elements / native sheets |
| Accessibility | WCAG 2.1 AA on web, platform a11y basics on mobile | Public-facing consumer app |
| Cost ceiling | Idle infra ≤ ~150 EUR/month before real traffic | Solo developer budget |

### A8. Regulatory notes (must be checked in S002, not assumed)

- In Hungary, ride-hailing must be performed by licensed taxi drivers with licensed vehicles; in Budapest the fare is a regulated fixed tariff (base + per-km + per-minute). "Upfront fare" must be computed with the legal tariff, not a free-form price.
- Every ride is a taxable service: receipts/invoices must comply with NAV rules (online invoice reporting). Plan for an invoicing provider integration (e.g. a Hungarian API such as számlázz.hu / Billingo) rather than home-grown invoices.
- GDPR: location history is personal data. We need a DPIA, retention rules, export and delete-my-account flows, and DPAs with AWS, Azure, Stripe, Mapbox, Expo, Sentry.
- App stores: background location on the driver app needs a clear justification and in-app disclosure.

---

## Part B — Architecture

### B1. High-level diagram

The maintained diagrams are the Structurizr views in [architecture/](./architecture/README.md). This sketch is a quick orientation only.

```
  Passenger app (Expo: iOS/Android/Web)   Driver app (Expo: iOS/Android)   Admin (Next.js)
           │  HTTPS + WSS                        │  HTTPS + WSS                 │ HTTPS
           └───────────────┬─────────────────────┴──────────────────────────────┘
                           │  api.  (web builds load from CloudFront + WAF → S3)
                           ▼
                     ALB + WAF (HTTPS, WSS)
                           │
              ECS Fargate: `api` service (NestJS)
              ├── REST (OpenAPI)         ├── Socket.IO gateway
              ├── Matching engine        ├── Fare/quote service
              └── Stripe webhooks        └── Background jobs (BullMQ)
                    │            │                 │
             RDS PostgreSQL   ElastiCache      S3 (driver docs,
             + PostGIS        Redis            receipts, dumps)
             (Multi-AZ prod)  (GEO index,
                              pub/sub, queues)
                    │
        ┌───────────┴───────────┐
   AWS Backup vault        Nightly encrypted dump
   (+ copy to eu-west-1)   → S3 → Azure Blob (immutable)
                                     │
                              Azure Key Vault (dump key,
                              escrowed break-glass secrets)

  External: Stripe (payments, Connect payouts) · Mapbox (maps, geocoding, directions)
            Cognito (identity) · SES (email) · SNS (SMS OTP) · Expo Push (FCM/APNs) · Sentry
```

### B2. Stack decisions (decided, with rationale)

| Layer | Choice | Why this and not the alternative |
|---|---|---|
| Language | TypeScript everywhere | One language across three apps and the API; shared types and validation schemas. |
| Mobile + web app | React Native with Expo (Expo Router, EAS Build/Submit/Update) | Passenger web target comes for free via react-native-web; EAS removes Xcode/Gradle pain for a solo dev. |
| Admin web | Next.js, static export | ~~Server components for data-heavy tables~~ (would need a server runtime; corrected 2026-09-19, [ADR 2](./architecture/decisions/0002-expo-for-mobile-apps-and-next-static-admin.md)). Static export on the CDN, all data from the API; mature table/form ecosystem for a desktop admin, not worth forcing into Expo. |
| API | NestJS | Opinionated structure, first-class WebSocket gateways, DI makes testing straightforward. |
| Database | PostgreSQL 16 + PostGIS on RDS | Relational integrity for rides/payments; PostGIS for service-area polygons and geo history. Aurora deferred until scale justifies its price. |
| ORM / migrations | Drizzle ORM + drizzle-kit | Thin, SQL-close, works well with PostGIS raw queries; Prisma's PostGIS support is weaker. |
| Realtime | Socket.IO with Redis adapter | Works through ALB, reconnect logic built in, rooms map cleanly to rides. |
| Live driver index | Redis GEO (`GEOADD`/`GEOSEARCH`) | Sub-ms nearest-driver lookup; Postgres is the system of record, Redis is the hot index. |
| Jobs / queues | BullMQ on the same Redis | Quote expiry, offer timeouts, payout batching, dump exports. |
| Identity | Amazon Cognito user pools (phone OTP via SNS), groups: passenger / driver / admin | Native to the primary cloud, no per-MAU bill at MVP scale. Trade-off: weaker DX than Auth0/Clerk; acceptable. |
| Payments | Stripe + Stripe Connect (Express) | EU-ready, Apple/Google Pay, keeps us in PCI SAQ-A, driver payouts without building a ledger. |
| Maps | Mapbox (maps SDK, geocoding, directions) | Predictable pricing for a solo dev; Google Maps Platform is the fallback if ETA quality is insufficient in the target city. |
| Compute | ECS Fargate | Containers-first, long-lived WebSockets rule out Lambda for the gateway. EKS is overkill for one service. |
| IaC | Terraform (one toolchain for AWS and Azure) | CDK would leave Azure out; Terraform covers both with one mental model. |
| CI/CD | GitHub Actions with OIDC to AWS and Azure | No long-lived cloud keys in GitHub. |
| Monorepo | pnpm workspaces + Turborepo | Shared packages, cached builds, one lockfile. |
| Observability | CloudWatch + OpenTelemetry (traces to X-Ray) + Sentry (apps & API) | Enough for MVP; Grafana Cloud is the upgrade path if CloudWatch dashboards annoy. |
| Email / SMS | SES / SNS | Native, cheap; SMS OTP cost is the one to watch. |
| Error tracking | Sentry (EU data region) | Best RN + Nest support; EU region for GDPR. |

### B3. Repository layout

```
hopin/
├── apps/
│   ├── passenger/        Expo app (iOS, Android, Web)
│   ├── driver/           Expo app (iOS, Android)
│   ├── admin/            Next.js
│   ├── api/              NestJS
│   └── trip-share/       tiny static page (Next.js export or plain Vite) for public tracking links
├── packages/
│   ├── shared/           zod schemas, TS types, ride state machine, fare calculator (pure functions)
│   ├── ui/               shared RN components + design tokens
│   └── api-client/       generated from OpenAPI
├── infra/
│   ├── terraform/
│   │   ├── modules/      network, ecs-service, rds, redis, s3, cognito, backup, azure-vault, azure-blob
│   │   ├── envs/dev, staging, prod
│   │   └── bootstrap/    state backends, OIDC providers
│   └── docker/           docker-compose for local Postgres/PostGIS + Redis
├── docs/
│   ├── hopin-pre-plan.md
│   ├── hopin-plan.md     ← this file
│   ├── architecture/     Structurizr model, ADRs (decisions/), overview; see its README
│   └── runbooks/         deploy, restore, incident, break-glass
└── .github/workflows/
```

### B4. Domain model v1

| Entity | Key fields | Notes |
|---|---|---|
| `users` | id, phone (unique), role[], display_name, status, created_at | One row per human; role can be both passenger and driver. |
| `passenger_profiles` | user_id, stripe_customer_id, default_payment_method, rating_avg | |
| `driver_profiles` | user_id, status (pending/approved/suspended), stripe_connect_account_id, licence_no, rating_avg, online (bool) | Online state also mirrored in Redis. |
| `driver_documents` | id, driver_id, type, s3_key, status, reviewed_by, reviewed_at | S3 keys, never public. |
| `vehicles` | id, driver_id, plate, make, model, colour, seats, taxi_permit_no | |
| `fare_configs` | id, version, base_fee, per_km, per_min, min_fare, cancel_fee, wait_free_min, active_from | Versioned so historical rides stay reproducible. |
| `service_areas` | id, name, polygon (geography), active | PostGIS polygon; requests outside are rejected at quote time. |
| `quotes` | id, passenger_id, pickup (point), dropoff (point), distance_m, duration_s, fare_config_id, amount, currency, expires_at | |
| `rides` | id, quote_id, passenger_id, driver_id, vehicle_id, state, requested_at, matched_at, arrived_at, started_at, completed_at, cancelled_at, cancel_reason, final_amount, tip_amount | |
| `ride_events` | id, ride_id, type, actor_id, position (point), payload jsonb, created_at | Append-only. |
| `ride_offers` | id, ride_id, driver_id, sent_at, responded_at, response | Matching audit. |
| `driver_locations` | driver_id, position, heading, speed, recorded_at | Batched inserts every ~10 s from Redis; hot path is Redis only. |
| `payments` | id, ride_id, stripe_payment_intent_id, status, amount, captured_amount, refunded_amount | |
| `payouts` | id, driver_id, stripe_transfer_id, period_start, period_end, amount, status | |
| `ratings` | id, ride_id, rater_id, ratee_id, score, comment | One per direction per ride. |
| `trip_shares` | id, ride_id, token, created_at, expires_at, revoked | Token is what the public link uses. |
| `devices` | id, user_id, expo_push_token, platform, last_seen_at | |
| `audit_log` | id, admin_id, action, target, payload, created_at | Every admin action. |

### B5. API surface (v1, summary)

REST under `/v1`, OpenAPI-documented, JWT (Cognito) bearer auth. Full contract is produced in S006.

- `auth/*` — token exchange helpers only; OTP itself is Cognito.
- `me`, `me/devices`, `me/payment-methods`
- `quotes` (POST), `rides` (POST from quote), `rides/:id`, `rides/:id/cancel`, `rides/:id/share`, `rides/:id/rating`, `rides/:id/tip`
- `driver/onboarding/*`, `driver/status` (online/offline), `driver/offers/:id/accept|decline`, `driver/rides/:id/arrived|start|complete`, `driver/earnings`
- `admin/drivers`, `admin/drivers/:id/approve|reject|suspend`, `admin/rides`, `admin/rides/:id/refund`, `admin/users/:id/block`, `admin/fare-configs`, `admin/service-areas`
- `share/:token` — public, returns minimal live position for the trip-share page
- `webhooks/stripe`

Realtime (Socket.IO namespaces):
- `/passenger` — join `ride:<id>` room; receives `ride.state`, `driver.position`, `ride.eta`.
- `/driver` — emits `location` every 3 s while online; receives `offer.new`, `offer.expired`, `ride.state`.
- `/admin` — receives aggregated `ops.snapshot` every 5 s.

---

## Part C — Platform, security, backup

### C1. Environments and accounts

| Env | AWS account | Purpose | Data |
|---|---|---|---|
| `dev` | hopin-dev | Everything deploys here on merge to `main` | Synthetic only |
| `staging` | hopin-staging | Release candidates, store TestFlight/internal builds point here | Synthetic + beta testers |
| `prod` | hopin-prod | Real users | Real |
| — | hopin-management | AWS Organization root, IAM Identity Center, billing, org CloudTrail | None |

Azure: one tenant, one subscription `hopin-secondary`, resource groups `rg-hopin-backup-weu` and `rg-hopin-vault-weu`. Region West Europe (Netherlands) or Germany West Central; pick in S012 based on Key Vault/Blob immutability feature availability.

### C2. Security model

- **Identity:** IAM Identity Center with MFA for humans; no IAM users. GitHub Actions assume roles via OIDC scoped per environment. Azure: Entra ID, PIM-style just-in-time not needed at solo scale but MFA is mandatory.
- **Secrets:** AWS Secrets Manager is the runtime source of truth (DB creds, Stripe keys, Mapbox tokens, Cognito app secrets). ECS tasks read them at start via task-definition secrets. Rotation: DB creds automatic (Secrets Manager rotation Lambda), third-party keys manual with a calendar reminder.
- **Azure Key Vault role:** escrow copies of root-level credentials (AWS break-glass user, Stripe restricted key, Terraform state KMS key material export policy), plus the encryption key for off-cloud database dumps. Purge protection and soft-delete on; access only to the owner identity and the backup pipeline's federated identity.
- **Encryption:** KMS customer-managed keys for RDS, S3, EBS, CloudWatch logs, Secrets Manager. TLS 1.2+ everywhere, ACM certificates.
- **Network:** private subnets for ECS, RDS, Redis; only ALB and NAT in public subnets; VPC endpoints for S3, ECR, Secrets Manager, CloudWatch so tasks never traverse NAT for AWS APIs.
- **Edge:** CloudFront for web builds; AWS WAF (managed core rule set) on both CloudFront and the API load balancer, rate limits on `/quotes` and `/rides` at the load balancer and on sign-in at the Cognito user pool (OTP is Cognito's, not the API's); Shield Standard.
- **App security:** zod validation on every boundary, idempotency keys on ride and payment creation, Stripe webhook signature verification, presigned S3 uploads with content-type and size limits, driver documents never publicly readable.
- **Supply chain:** Dependabot, `pnpm audit` in CI, Trivy image scan in CI and ECR scan on push, secret scanning on the repo.
- **Detection:** CloudTrail org trail, GuardDuty, Security Hub CIS benchmark, AWS Config rules for "no public S3", "RDS encrypted", "no 0.0.0.0/0 on SSH". Azure Defender for Storage and Key Vault at the basic tier.

### C3. Data protection and GDPR

- Retention: raw `driver_locations` 90 days, then aggregated; `ride_events` 2 years (dispute window + tax); invoices per Hungarian law (8 years) but stored in the invoicing provider.
- Passenger self-service: export my data (async job → S3 presigned link, 24 h), delete my account (soft delete, PII scrubbed after 30 days, financial records kept pseudonymised).
- DPIA document lives in `docs/compliance/`. DPAs with every processor listed in A8.
- Trip-share links: expire 2 h after ride completion, revocable by the passenger.

### C4. Multi-cloud strategy (what Azure actually does)

Decision: **AWS runs everything users touch. Azure is the "not-AWS" safety net.** This gives a real, defensible reason to use both clouds without doubling the platform.

| Concern | AWS (primary) | Azure (secondary) |
|---|---|---|
| Compute, DB, cache, edge | ✔ all of it | — |
| Runtime secrets | Secrets Manager + KMS | Key Vault: escrow + dump encryption key |
| Backups, same provider | AWS Backup vault (Vault Lock), PITR, cross-region copy to eu-west-1 | — |
| Backups, different provider | — | Nightly encrypted `pg_dump` + S3 driver-document sync into Azure Blob with immutability policy (WORM) and versioning |
| Disaster recovery target | Restore in eu-west-1 from AWS Backup (RTO 4 h) | Documented cold-restore path: Azure Database for PostgreSQL + Container Apps from the dump (RTO 24 h). Built as a **tested runbook and Terraform module, not a running environment** |
| Monitoring of the backup itself | CloudWatch alarm if nightly job fails | Azure Monitor alert if no new blob in 26 h |

Why this shape: a single-vendor account compromise, billing lockout, or region-wide incident is the realistic catastrophic scenario for a solo operator. Off-provider, immutable backups plus escrowed secrets are what get you back. A live Azure standby would double IaC surface, identity surface and cost for a benefit we can't operate alone yet. Revisit after launch (S110).

### C5. Backup and restore

| What | Method | Frequency | Retention | Where |
|---|---|---|---|---|
| RDS | Automated snapshots + PITR | Continuous / daily | 35 days PITR, 90 days snapshots | eu-central-1 + copy eu-west-1 |
| RDS logical dump | `pg_dump` in a scheduled ECS task, encrypted with a Key Vault-held key | Nightly | 30 daily, 12 monthly | S3 → Azure Blob (immutable) |
| Driver documents (S3) | Versioning + replication rule | Continuous | Indefinite while driver active | eu-central-1 + Azure Blob sync nightly |
| Redis | Not backed up (rebuildable hot index) | — | — | — |
| Terraform state | S3 versioning + Key Vault escrow of the state KMS key | Continuous | 1 year of versions | S3 |
| Secrets | Secrets Manager (versions) + Key Vault escrow | On change | — | Both |
| Restore drill | Full restore into a scratch account, run smoke tests, destroy | Quarterly | — | Runbook in `docs/runbooks/restore.md` |

### C6. Observability

- **Logs:** structured JSON (pino) → CloudWatch Logs, 30-day retention dev, 90-day prod; PII fields redacted at the logger.
- **Metrics:** ECS/ALB/RDS/Redis defaults plus custom: `match_latency_ms`, `offers_per_ride`, `ws_connected_drivers`, `quote_to_request_rate`, `payment_capture_failures`.
- **Traces:** OpenTelemetry SDK in NestJS → X-Ray; trace id propagated into logs.
- **Apps:** Sentry for crashes and performance; EAS Update rollout monitored against crash-free rate.
- **Alerts (page-worthy):** API 5xx rate > 2 % for 5 min, match latency p95 > 5 s, websocket driver count drops > 50 % in 5 min, RDS free storage < 15 %, nightly backup missing, Stripe webhook failures > 0 in 10 min.
- **Status page:** simple hosted page (e.g. a static page on CloudFront updated by hand at MVP).

### C7. CI/CD

- PR: lint, typecheck, unit tests, integration tests (Testcontainers), Trivy, `terraform plan` for touched envs.
- Merge to `main`: build images → push ECR → deploy `dev` → run smoke tests.
- Tag `v*-rc`: deploy `staging`, EAS build for internal track / TestFlight.
- Tag `v*`: manual approval gate → deploy `prod` (rolling, ECS circuit breaker on) → EAS Submit to stores → EAS Update to production channel only after store build is live.
- Rollback: ECS previous task definition (one command, in runbook); EAS Update republish previous.

### C8. Rough monthly cost (prod, idle-to-light traffic, EUR)

| Item | Estimate |
|---|---|
| ECS Fargate (2 × 0.5 vCPU / 1 GB) | ~35 |
| RDS PostgreSQL db.t4g.small Multi-AZ | ~60 |
| ElastiCache cache.t4g.micro | ~15 |
| NAT Gateway (1) | ~35 |
| ALB | ~20 |
| CloudFront, S3, Route 53, CloudWatch | ~10 |
| AWS Backup + cross-region copy | ~5 |
| Azure Blob (cool, ~50 GB) + Key Vault | ~5 |
| Sentry (dev tier), Mapbox, Expo (free tiers at MVP) | 0–30 |
| SMS OTP (SNS, HU) | usage-based, ~0.05 per message |
| **Total** | **~190–220** |

Dev environment: single-AZ RDS, no NAT (VPC endpoints only), Fargate Spot, scale-to-zero overnight via scheduled scaling → ~50. Above the 150 ceiling in A7 for prod; the levers are NAT removal (endpoints only) and single-AZ RDS until real traffic. Revisit in S102.

---

## Part D — Roadmap and step list

Status legend: `todo` · `doing` · `done` · `blocked` · `dropped`

Each step is sized for roughly half a day to two days of solo work. Dependencies are the step IDs in the last column.

### Phase 0 — Product definition and foundations

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S001 | Finalize scope, non-goals and NFRs (this document, Parts A–C) | You've read and signed off on Part A and Part C4 | doing | — |
| S002 | Regulatory and legal check for operating in Hungary | Written memo: licensing requirements, Budapest tariff rules, NAV invoicing obligation, chosen invoicing provider, GDPR DPIA outline | todo | S001 |
| S003 | Ride state machine and event catalogue | `packages/shared` contains the state machine as pure TS with exhaustive tests; A6 updated if it changed | todo | S001 |
| S004 | Fare model definition | Formula and parameters documented (needs your input, see Part F); implemented as a pure function with tests | todo | S002 |
| S005 | Domain model and ERD | B4 refined, ERD in `docs/architecture/data/`, first Drizzle schema committed | todo | S003, S004 |
| S006 | API and realtime contract | OpenAPI 3.1 file and Socket.IO event schema (zod) in `packages/shared`; reviewed against every journey in A5 | todo | S005 |
| S007 | Design system and wireframes | Tokens (colour, type, spacing), key screens for all three surfaces in Figma/Stitch; exported to `packages/ui` | todo | S001 |
| S008 | Domain name and DNS | Domain registered, hosted zone in Route 53, `dev.`/`staging.`/`api.`/`admin.`/`share.` subdomains planned | todo | — |
| S009 | GitHub repository and conventions | Repo created, branch protection on `main`, conventional commits enforced, CODEOWNERS, PR template; ADR template already in `docs/architecture/templates/` | todo | — |
| S010 | Monorepo scaffold | pnpm + Turborepo, shared tsconfig, ESLint/Prettier, `packages/shared` compiles, `pnpm test` runs in CI | todo | S009 |

### Phase 1 — Cloud accounts, identity, IaC bootstrap

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S011 | AWS Organization and accounts | Management + dev/staging/prod accounts, IAM Identity Center with MFA, SCPs denying non-EU regions and root usage | todo | — |
| S012 | Azure tenant and subscription | Subscription `hopin-secondary`, resource groups, MFA, budget alert, region chosen and recorded in C1 | todo | — |
| S013 | Terraform state backends | S3 + DynamoDB state per env with KMS encryption; Azure state in the same S3 (single toolchain), state bucket versioned | todo | S011 |
| S014 | Terraform module layout | `infra/terraform/modules` and `envs/*` skeleton, `terraform plan` clean in CI for dev | todo | S013 |
| S015 | GitHub OIDC federation to AWS and Azure | Workflows assume roles without stored keys; roles scoped per env; verified with a no-op workflow | todo | S011, S012, S014 |
| S016 | Network (VPC) | 3-AZ VPC, public/private subnets, NAT (prod) or endpoints-only (dev), VPC endpoints for S3/ECR/Secrets/Logs, flow logs on | todo | S014 |
| S017 | KMS keys and secrets structure | CMKs for data/backup/logs, Secrets Manager naming convention `hopin/<env>/<service>/<name>`, rotation enabled for DB creds | todo | S014 |
| S018 | Azure Key Vault | Vault with purge protection, RBAC, dump encryption key created, escrow procedure documented in `docs/runbooks/break-glass.md` | todo | S012 |
| S019 | Budgets, cost alerts, tagging | AWS Budgets per account, Azure budget, mandatory tags (`env`, `service`, `owner`) enforced by SCP/policy | todo | S011, S012 |
| S020 | Security baseline | Org CloudTrail, GuardDuty, Security Hub CIS, Config rules from C2; Azure Defender basic on Storage and Key Vault | todo | S011, S012 |
| S021 | Container registry | ECR repos with scan-on-push, lifecycle policy keeping last 20 images | todo | S014 |
| S022 | Local development environment | `docker-compose` with PostGIS + Redis, seed script, `.env.example`, README "run locally in 5 minutes" | todo | S010 |

### Phase 2 — Backend core

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S023 | NestJS skeleton | Config module (validated env), health/ready endpoints, pino logging with PII redaction, OpenTelemetry wired | todo | S010, S022 |
| S024 | Database layer and migrations | Drizzle configured with PostGIS types, migration pipeline runs in CI against Testcontainers | todo | S023 |
| S025 | Schema v1 | All B4 tables migrated, seed data for dev, ERD regenerated | todo | S005, S024 |
| S026 | Authentication | Cognito user pools (phone OTP via SNS), groups passenger/driver/admin, JWT guard + role decorator in Nest, e2e test for each role | todo | S017, S023 |
| S027 | Users and profiles | `me` endpoints, device registration, passenger profile creation on first login | todo | S025, S026 |
| S028 | Driver onboarding API | Document upload via presigned S3 (type/size limits), vehicle registration, status transitions pending→approved | todo | S027 |
| S029 | Maps services | Mapbox proxy for geocoding/autocomplete and directions with caching; server-side only tokens | todo | S023 |
| S030 | Fare quote service | `POST /quotes` validates service area (PostGIS), computes distance/duration, applies active fare config, returns quote with TTL | todo | S004, S025, S029 |
| S031 | Matching engine | Redis GEO index of online drivers, offer loop (nearest N, 15 s timeout each, max 5 offers), fallback to NO_DRIVER; metrics emitted | todo | S030 |
| S032 | Ride lifecycle | All A6 transitions as endpoints with guards, `ride_events` written, cancellation fee rules | todo | S003, S031 |
| S033 | Realtime gateway | Socket.IO namespaces per B5, Redis adapter, driver location ingest → Redis GEO + batched Postgres writes, passenger room fan-out | todo | S031 |
| S034 | Push notifications | Expo Push service integration, templates for every ride event, retry and token cleanup | todo | S027, S032 |
| S035 | Trip sharing | `share` endpoint issues token, public `share/:token` returns position + ETA, expiry and revoke | todo | S033 |
| S036 | Ratings | Both-direction ratings with one-per-ride constraint, rolling averages on profiles | todo | S032 |
| S037 | Admin API | Driver approval, ride search, refund trigger, fare config CRUD (versioned), service area CRUD, user block; every call audited | todo | S028, S032 |
| S038 | Hardening | Rate limiting (Redis), idempotency keys, zod on all inputs, error envelope, request ids in responses | todo | S032 |
| S039 | Test suite | Unit + integration (Testcontainers) ≥ 80 % coverage; contract tests generated from OpenAPI | todo | S038 |
| S040 | Container image | Multi-stage Dockerfile, non-root, distroless runtime, Trivy clean, image < 200 MB | todo | S023 |

### Phase 3 — Payments

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S041 | Stripe accounts | Stripe account (HU entity), Connect enabled, restricted API keys in Secrets Manager, test mode wired to dev/staging | todo | S017 |
| S042 | Payment methods | SetupIntent flow, saved cards, Apple Pay / Google Pay merchant setup, default method on profile | todo | S027, S041 |
| S043 | Ride charging | PaymentIntent authorised at MATCHED for the quote amount, captured at COMPLETED with final amount, tip as separate capture/charge | todo | S032, S042 |
| S044 | Webhooks | Signature-verified, idempotent handler for intent/charge/payout events, reconciliation job comparing Stripe vs `payments` nightly | todo | S043 |
| S045 | Driver payouts | Connect Express onboarding link in driver app, weekly transfer job, `payouts` records, failure alerts | todo | S028, S041 |
| S046 | Refunds and cancellation fees | Admin refund (full/partial), automatic cancellation fee per S004 rules, passenger-visible breakdown | todo | S037, S043 |
| S047 | Receipts and invoices | SES receipt email after capture; invoicing-provider integration per S002 memo | todo | S002, S043 |
| S048 | Payment tests | Stripe test cards and fixtures covering auth failure, capture failure, refund, disputed charge | todo | S044 |

### Phase 4 — Passenger app

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S049 | Expo app scaffold | Expo Router, TS, web target builds, `packages/ui` tokens applied, EAS project linked, Sentry installed | todo | S007, S010 |
| S050 | Auth screens | Phone entry, OTP, profile completion, session persistence, logout | todo | S026, S049 |
| S051 | Map home | Mapbox map, current location, permission flows with rationale, service-area boundary shown | todo | S029, S049 |
| S052 | Pickup and destination | Autocomplete search, draggable pickup pin, recent places | todo | S051 |
| S053 | Quote and confirm | Fare card with breakdown, quote countdown, payment method chip, confirm → `POST /rides` | todo | S030, S042, S052 |
| S054 | Requesting and matched | Searching animation, driver + vehicle card, live driver marker via Socket.IO, ETA | todo | S033, S053 |
| S055 | In-trip | Route line, ETA, driver contact (masked call), SOS button (calls 112, logs event) | todo | S054 |
| S056 | Share trip | Native share sheet with link, revoke from trip screen | todo | S035, S055 |
| S057 | Trip complete | Rating, tip presets, receipt summary | todo | S036, S043, S055 |
| S058 | History and settings | Ride history with receipts, payment methods management, delete account, export data | todo | S057 |
| S059 | Push and deep links | Notification handling foreground/background, deep links into ride screens | todo | S034, S054 |
| S060 | Resilience | Offline banner, reconnect logic, optimistic state with server reconciliation, error screens | todo | S054 |
| S061 | Web build and hosting | Expo web export → S3 + CloudFront, PWA manifest, responsive layout for desktop | todo | S049, S085 |
| S062 | Passenger E2E tests | Maestro flows: login, book ride (mock driver), cancel, share, rate | todo | S057 |

### Phase 5 — Driver app

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S063 | Driver app scaffold | Second Expo app sharing `packages/ui` and `api-client`, EAS project, Sentry | todo | S049 |
| S064 | Onboarding | Document capture (camera + gallery), vehicle form, pending-approval screen with status polling | todo | S028, S063 |
| S065 | Online/offline and background location | Foreground service (Android), background location mode (iOS), 3 s location emit while online, permission rationale screens | todo | S033, S063 |
| S066 | Ride offers | Full-screen offer with countdown, pickup distance, fare; accept/decline; sound + vibration | todo | S031, S065 |
| S067 | To pickup and trip control | Navigate button (deep link to Google/Apple/Waze), Arrived → Start → Complete buttons with confirmations | todo | S032, S066 |
| S068 | Trip summary | Earnings for the ride, passenger rating prompt | todo | S036, S067 |
| S069 | Earnings and payouts | Daily/weekly earnings, payout history, Connect dashboard link | todo | S045, S068 |
| S070 | Account | Ratings received, documents status, vehicle, support contact | todo | S064 |
| S071 | Battery and data optimisation | Adaptive location interval when stationary, batching, measured < 5 % battery/hour online | todo | S065 |
| S072 | Driver E2E tests | Maestro flows: go online, accept offer, complete ride | todo | S068 |

### Phase 6 — Admin web

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S073 | Admin scaffold | Next.js as a static export (client-side data from the API), Cognito admin-group auth, layout, data tables | todo | S026, S010 |
| S074 | Live operations map | Online drivers and active rides on a map, refreshed via `/admin` socket namespace | todo | S033, S073 |
| S075 | Driver verification queue | Document viewer (presigned), approve/reject with reason, notification to driver | todo | S028, S073 |
| S076 | Rides | Search/filter, ride detail with event timeline on map, refund action | todo | S037, S046, S073 |
| S077 | Users | Search, block/unblock, view ratings, GDPR export/delete triggers | todo | S037, S073 |
| S078 | Configuration | Fare config editor with versioning, service-area polygon editor | todo | S037, S073 |
| S079 | Support tools | Trip-share lookup, incident notes on rides, audit log view | todo | S076 |
| S080 | Admin hosting | Deployed behind CloudFront + WAF with IP allowlist, `admin.` subdomain | todo | S085, S073 |

### Phase 7 — Platform deploy, CI/CD, observability

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S081 | ECS Fargate API service | Task definition with Secrets Manager injection, ALB with WSS support and 300 s idle timeout, target tracking autoscaling, circuit breaker | todo | S016, S040 |
| S082 | RDS PostgreSQL + PostGIS | Multi-AZ prod / single-AZ dev, CMK encrypted, Performance Insights, parameter group tuned, IAM auth for the dump task | todo | S016, S017 |
| S083 | ElastiCache Redis | Encrypted in transit and at rest, auth token in Secrets Manager | todo | S016 |
| S084 | S3 buckets | Documents, dumps, web assets; block public access, versioning, lifecycle, CMK | todo | S017 |
| S085 | Edge: CloudFront, ACM, Route 53 | Certificates issued, distributions for web/share/admin, `api.` on ALB directly with ACM | todo | S008, S081 |
| S086 | WAF | Web ACLs on CloudFront, the API load balancer and the Cognito user pool; rate-based rules on quote/ride paths and sign-in; logging to S3 | todo | S085 |
| S087 | CI/CD pipelines | C7 implemented end-to-end; dev deploys on merge, prod needs approval; rollback runbook written and tested | todo | S015, S081 |
| S088 | Mobile build pipelines | EAS Build profiles (dev/preview/prod), EAS Submit to TestFlight and Play internal, EAS Update channels, signing credentials stored in EAS | todo | S049, S063 |
| S089 | Observability stack | C6 dashboards live, traces visible end-to-end, log retention set | todo | S081 |
| S090 | Alerting and on-call | C6 alarms → SNS → phone/email; alert runbook links | todo | S089 |
| S091 | Error tracking | Sentry projects (EU region) for both apps, admin and API; source maps uploaded from CI | todo | S087, S088 |
| S092 | Load test | k6 scenarios: 200 concurrent drivers emitting location, 50 ride requests/min; p95 targets from A7 met or capacity notes written | todo | S081, S083 |

### Phase 8 — Backup, DR, security hardening, compliance

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S093 | AWS Backup | Backup plan for RDS and S3 with Vault Lock (compliance mode after testing), cross-region copy to eu-west-1, restore tested once | todo | S082, S084 |
| S094 | Off-cloud backup to Azure | Nightly ECS task: `pg_dump` → encrypt with Key Vault key → S3 → Azure Blob (immutable policy, versioning); driver-document sync; Azure Monitor alert if no blob in 26 h | todo | S018, S082, S093 |
| S095 | Secrets escrow and break-glass | Escrow list from C2 stored in Key Vault, break-glass runbook tested by actually using it once | todo | S018, S017 |
| S096 | DR runbook and restore drill | `docs/runbooks/restore.md` for same-region, cross-region and cross-cloud paths; first full drill completed with timings recorded | todo | S093, S094 |
| S097 | Azure cold-restore module | Terraform module for Azure Database for PostgreSQL + Container Apps that can stand up the API from a dump; applied once in a drill, then destroyed | todo | S096 |
| S098 | Security review | Dependency, container and secret scanning green; OWASP ASVS L1 checklist done; findings fixed or accepted with reason | todo | S087 |
| S099 | Threat model | STRIDE on ride lifecycle, payments, driver onboarding; mitigations tracked as issues | todo | S098 |
| S100 | GDPR deliverables | DPIA written, privacy policy, retention jobs implemented (C3), export/delete flows verified, DPAs collected | todo | S002, S058, S077 |
| S101 | Incident response | Runbook with severity levels, comms templates, status page process; one tabletop exercise done | todo | S090 |
| S102 | Cost review | Actual vs C8, right-sizing applied, savings plan decision documented | todo | S092 |

### Phase 9 — Launch

| ID | Step | Done when | Status | Depends |
|---|---|---|---|---|
| S103 | Store accounts and listings | Apple Developer + App Store Connect, Google Play Console, listings, screenshots, privacy nutrition labels / data safety forms | todo | S088 |
| S104 | Closed beta | 5–10 licensed drivers and ~30 passengers on TestFlight / Play internal against staging; feedback logged | todo | S062, S072, S103 |
| S105 | Store review readiness | Background-location justification, payment compliance, demo account for reviewers, review notes | todo | S104 |
| S106 | Marketing site | Landing page with app links, driver sign-up CTA, legal pages; hosted on S3 + CloudFront | todo | S085 |
| S107 | Legal documents | Terms of service, driver agreement, privacy policy live in apps and web | todo | S100 |
| S108 | Soft launch | Production live in one district; SLO dashboard watched daily for two weeks; kill-switch (service area) ready | todo | S105, S107, S096 |
| S109 | Post-launch loop | Weekly triage of Sentry, support tickets, driver feedback into backlog | todo | S108 |
| S110 | Retrospective and v2 plan | Retro written; v2 scope chosen from A4 (scheduled rides, surge, chat, promo codes, Azure standby?) | todo | S109 |

---

## Part E — Step details

Each step gets a section here when it starts. Template:

```
### S0xx — <title>
**Status:** doing · **Started:** YYYY-MM-DD · **Finished:** —
**Goal:** one sentence.
**Decisions:** bullets, with the alternative rejected and why.
**Work log:** what was actually done, commands, links to PRs.
**Result / verification:** how we proved it's done.
**Follow-ups:** new steps or issues this created.
```

### S001 — Finalize scope, non-goals and NFRs
**Status:** doing · **Started:** 2026-09-19 · **Finished:** —
**Goal:** Turn the pre-plan into a buildable plan with committed stack, cloud strategy and step list.
**Decisions:**
- AWS primary, Azure secondary as "not-AWS safety net" (backups, escrow, DR target). Rejected: live Azure standby (doubles surface for a solo operator).
- React Native + Expo for passenger (incl. web) and driver; Next.js for admin. Rejected: Flutter (second language), native (three codebases).
- NestJS + PostgreSQL/PostGIS + Redis on ECS Fargate. Rejected: Lambda (long-lived WebSockets), EKS (operational weight).
- Terraform for both clouds. Rejected: CDK (AWS-only).
**Work log:** Wrote this document. Integrated architect-base (architecture skills, Structurizr model with 8 views, ADRs 0001–0008, PDF tooling) and the ECC language rules for this stack; see `CLAUDE.md`. Modelling surfaced two corrections, recorded in the changelog.
**Result / verification:** Pending your review of Part A and Part C4.
**Follow-ups:** Part F items need your answers before S004 and S002 can close.

---

## Part F — Decisions needed from you

These shape business logic, so they are yours, not mine. Answer inline here and we'll fold them into the relevant step.

1. **Fare formula (blocks S004, S030).** Do we follow the Budapest regulated tariff exactly (base fee + per-km + per-minute, no discounting), or is the launch city different? Write the numbers you want to launch with, or "use current legal tariff" and I'll parameterise it.
2. **Launch city and service area (blocks S078, S108).** Which city, and roughly which districts for the soft launch?
3. **Cancellation rules (blocks S046).** Free cancellation window after match (e.g. 2 minutes)? Fee amount after that? Free waiting time at pickup before a fee (e.g. 3 minutes)?
4. **Driver matching policy (S031).** Nearest-first only, or nearest with a rating floor (e.g. ≥ 4.3)? How many drivers to offer before giving up?
5. **Brand.** Colours/logo exist, or should S007 propose them?
6. **Azure region.** West Europe (Netherlands) vs Germany West Central. Default: Germany West Central for data-residency optics; West Europe if a required feature is missing there.

---

## Part G — Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Hungarian taxi regulation makes "upfront fare" or independent drivers illegal in the form we planned | Product pivot | S002 first, before any app code |
| SMS OTP cost or deliverability in HU | Login friction, cost | Budget alert on SNS; fallback to email OTP; consider WhatsApp later |
| App Store rejects driver background location | Launch delay | Follow Apple/Google guidance from day one (S065, S105), record a demo video |
| Solo on-call | Outages linger | Keep architecture boring, alarms actionable, runbooks short; scale-to-zero dev to save money for prod HA |
| Mapbox ETA quality in target city | Bad quotes, disputes | Compare against Google in S029; quote includes tolerance; final fare may adjust within ±10 % (subject to S002) |
| Multi-cloud scope creep | Never-ending infra | C4 hard rule: Azure only for backup/escrow/DR until S110 |
| Payment disputes / fraud | Money loss | Stripe Radar, 3DS where required, ride_events as evidence, cancellation fee caps |

---

## Part H — Changelog of this plan

| Date | Change |
|---|---|
| 2026-09-19 | v0.1 — initial plan from pre-plan; stack and cloud decisions recorded; 110 steps defined |
| 2026-09-19 | v0.2 — architecture knowledge base added under `docs/architecture/`. Corrections: admin is a Next.js static export, since server components would need a server runtime the plan never hosted (B2, S073). WAF sits on the load balancer and the Cognito pool as well as CloudFront, because the API bypasses CloudFront and sign-in codes are Cognito's (C2, S086). |
