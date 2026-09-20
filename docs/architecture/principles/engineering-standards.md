# Engineering Standards

Standards that every change follows. The ECC rules in `.claude/rules/ecc/` and
the user-level ECC common rules carry the detail; this page records what is
specific to Hopin.

| Area | Standard | Why |
|---|---|---|
| Language | TypeScript in strict mode everywhere, including infrastructure scripts where possible | One language across apps and API ([ADR 2](../decisions/0002-expo-for-mobile-apps-and-next-static-admin.md), [ADR 3](../decisions/0003-nestjs-postgresql-postgis.md)) |
| Validation | zod schemas at every boundary (HTTP, sockets, webhooks, env vars), shared from `packages/shared` | One source of truth for contracts |
| API contract | Contract first: OpenAPI 3.1 in `/api` before implementation; REST under `/v1` | Clients and server evolve separately |
| Idempotency | Idempotency keys on ride creation, payment calls and webhook handling | Retries must never double-charge ([QA-09](../requirements/quality-attributes.md)) |
| Money | Integer minor units (HUF), never floats | Rounding errors in fares |
| Time | UTC in storage and APIs; Europe/Budapest only at display | Tariff and audit correctness |
| Testing | Test-first; 80 % coverage minimum; integration tests with Testcontainers; Maestro for app flows | ECC testing rule |
| Git | Conventional commits; branch per change; pull request to `main`; no direct pushes | Ruleset `protect-main` |
| Reviews | ECC reviewer agents per area, listed in `CLAUDE.md` | Consistent review lens |
| Secrets | Never in code, docs or CI logs; Secrets Manager at runtime | Public repository |
| Docs | docs-sync audit before every pull request | [P-08](architecture-principles.md) |
