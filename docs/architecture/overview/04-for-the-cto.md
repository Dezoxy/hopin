# For the CTO

A reading path for a reviewer judging whether the design holds. Exposure,
tenancy, personal data, AI, where it runs and what happens when a provider is
lost. Six stops, each with the decision behind it.

## What is exposed, and where identity and secrets sit

Three web and app clients reach the API. Users authenticate against Cognito;
the API holds no card data, because card entry happens in Stripe's SDKs and
never touches Hopin
([ADR 7](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0007-stripe-connect-payments.md)).

![Security view: what is internet-facing, where users authenticate, and where secrets live](embed:Security)

- [Security architecture](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/security/security-architecture.md)
- [Threat model](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/security/threat-model.md): 31 threats, each with a planned control or a tracked risk
- [Trust boundaries](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/security/trust-boundaries.md)

## How one partner's data is kept from another

The hard requirement of the white-label model. Tenancy is enforced by
PostgreSQL row-level security on every partner-owned table, set per
transaction, not by application filters. Five steps show a request being
confined to its tenant. An operator sees a partner's data only under a
time-boxed grant from that partner.

![Partner isolation view: the five steps that keep a request inside its own tenant](embed:PartnerIsolation)

- [ADR 9: hybrid multi-tenancy](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0009-hybrid-multi-tenancy.md)
- [ADR 13: operator access by partner grant](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0013-operator-access-by-partner-grant.md)
- [QA-12](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/quality-attributes.md): zero cross-partner reads or writes, tested in CI on every schema change

## Where personal location data goes

A ride generates continuous location data about identifiable people. This view
follows it from the clients to every store and to the one regulator that
receives it.

![Location data view: where personal location data goes and where it leaves the system](embed:LocationData)

- [Data classification](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/security/data-classification.md): retention per class
- [Data architecture](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/data/data-architecture.md)

## Where AI is allowed, and what keeps real data away from evaluation

AI helps staff read and draft; it never acts. Real complaint text goes only to
Amazon Bedrock in an EU region. The evaluation plane, which uses OpenRouter,
receives synthetic cases only, and the boundary is enforced in code rather than
by convention.

![AI assist view: where AI helps staff, and what keeps real data away from evaluation models](embed:AiAssist)

- [ADR 14: AI assists staff, read and draft only](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0014-ai-assists-staff-read-and-draft-only.md)
- [ADR 15: Bedrock for data, OpenRouter for evaluation](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0015-bedrock-for-data-openrouter-for-evaluation.md)

## Where it runs, and what fails together

One region, Multi-AZ database, two API tasks, and no multi-region live
capacity. The availability target is 99.5 % monthly, which is deliberately
modest because one person is on call
([RISK-004](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/risks/architecture-risks.md)).

![Production core view: where the live service runs in AWS and what fails together](embed:ProductionCore)

- [ADR 4: ECS Fargate for the API](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0004-ecs-fargate-for-api.md)
- [Availability](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/reliability/availability.md)

## Surviving the loss of a provider

Two scenarios are designed for and neither has been drilled. Losing the region
is answered from AWS. Losing the whole AWS account is answered from Azure,
where encrypted immutable copies and the keys to read them are held outside
AWS. The account case has a known gap: Cognito credentials cannot be exported,
so every user must re-enrol by SMS after a restore
([RISK-017](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/risks/architecture-risks.md)).

![Off-provider recovery view: how data and keys leave AWS](embed:OffProviderRecovery)

![Account recovery view: what runs on Azure after the AWS account is lost, and what is missing](embed:AccountRecovery)

- [ADR 1: AWS primary, Azure for off-provider recovery](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0001-aws-primary-azure-for-off-provider-recovery.md)
- [Disaster recovery](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/reliability/disaster-recovery.md): the recovery targets, and what is unproven
