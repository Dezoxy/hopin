## Trust Boundaries

Threats per boundary and their controls: [threat-model.md](threat-model.md). The
**Security** view in `workspace.dsl` shows the modelled version: the `Client
devices (untrusted)`, `AWS eu-central-1` and `Azure (off-provider recovery)`
groups mark the boundaries.

```text
      Passenger / driver phones, browsers, trip-share viewers        Stripe
                               |                                       |
================= TB-1  Internet to edge ==============================|=====
   TLS, AWS WAF, rate limits, Cognito sign-in                  signed webhooks
                               |                                       |
                   Load balancer / CloudFront                          |
                               |                                       |
================= TB-2  Edge to private network ============================
   Only the load balancer reaches the API; JWT checked on every call
                               |
                           Hopin API
                     /         |          \
================= TB-3  API to data stores =================================
   Security groups, TLS, task IAM role, least privilege
               PostgreSQL     Redis     S3     Secrets Manager
                               |
================= TB-4  AWS to Azure =======================================
   Encrypted dump, write-only credential, immutable storage
                    Azure Blob, Azure Key Vault
```

| # | Boundary | What crosses it | Controls |
|---|---|---|---|
| TB-1 | Internet to edge | App and browser calls, sign-in, public trip-share polling, Stripe webhooks | TLS 1.2+, WAF, rate limits, Cognito, webhook signatures, share tokens |
| TB-2 | Edge to private network | Routed HTTPS and WebSocket traffic | Private subnets, security groups, JWT validation, role and ownership checks |
| TB-3 | API to data stores | SQL, Redis commands, S3 and secret reads | Security groups, TLS, task IAM role, no public endpoints |
| TB-4 | AWS to Azure | Encrypted dumps and document copies | Client-side encryption, write-only credential, immutability policy |
| TB-5 | Operator privileged access | Console, admin web, break-glass | MFA, admin group, WAF IP allowlist, audit log, escrowed break-glass credentials |
| TB-6 | Hopin to regulators and partners (planned) | BKK real-time feed ([C-05](../requirements/constraints.md)), invoicing provider, taxi-meter data | Defined when plan steps S112, S113 and S047 start |
| TB-7 | Hopin to model providers (planned) | Minimised case files to Amazon Bedrock in an EU region; synthetic cases only to OpenRouter | [Threat model TB-7](threat-model.md#tb-7-hopin-to-model-providers), [ADR 15](../decisions/0015-bedrock-for-data-openrouter-for-evaluation.md) |
