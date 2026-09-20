# For operators

A reading path for whoever is paged. Where it runs, how a failure becomes a
page, what degrades, and every restore path. Five stops.

## What runs where

![Production core view: where the live service runs in AWS and what fails together](embed:ProductionCore)

- [Deployment architecture](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/deployment/deployment-architecture.md)

## How a failure becomes a page

A page-worthy failure should reach the operator within five minutes
([QA-10](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/quality-attributes.md)).

![Alert path view: how a failure becomes a page to the operator](embed:AlertPath)

- [Observability architecture](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/observability/observability-architecture.md): the alarms and what each one means

## What degrades rather than fails

Redis holds only data that can be rebuilt, so losing it pauses matching and
drops live positions for seconds instead of losing rides.

![Redis lost view: what happens when the Redis node is lost](embed:RedisLost)

![Driver alarm view: the six steps from a driver alarm to dispatcher and operator](embed:DriverAlarm)

- [Availability](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/reliability/availability.md): the failure table, including the night-outage case

## Backups, and where copies live

Two chains. AWS Backup protects against corruption and region loss; a nightly
encrypted export to Azure protects against losing the AWS account itself. The
Azure upload credential is write-only and the blobs are immutable, so an
attacker inside AWS can add junk but cannot destroy the copies
([RISK-010](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/risks/architecture-risks.md)).

![AWS backups view: which backups exist and in which regions](embed:AwsBackups)

![Azure recovery view: where the nightly off-provider copy runs and where copies land](embed:AzureRecovery)

![Off-provider recovery view: how data and keys leave AWS](embed:OffProviderRecovery)

- [Backup strategy](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/reliability/backup-strategy.md)

## Restoring

Three scenarios, three different answers, and none of them has been drilled.
Corruption inside the region is a point-in-time restore. Losing the region
rebuilds in eu-west-1. Losing the AWS account rebuilds on Azure and leaves
every user needing to re-enrol, because Cognito credentials cannot be exported.

![Region recovery view: what runs in eu-west-1 after eu-central-1 is lost](embed:RegionRecovery)

![Account recovery view: what runs on Azure after the AWS account is lost, and what is missing](embed:AccountRecovery)

- [Disaster recovery](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/reliability/disaster-recovery.md): the targets per scenario
- [RISK-009](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/risks/architecture-risks.md): until the first drill, these targets are designs, not evidence
