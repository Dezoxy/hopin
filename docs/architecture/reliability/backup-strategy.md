## Backup Strategy

Why two providers: [ADR
1](../decisions/0001-aws-primary-azure-for-off-provider-recovery.md). A
successful backup is not a restore test; restore evidence is recorded in
[disaster-recovery.md](disaster-recovery.md).

| What | Method | Frequency | Retention | Where |
|---|---|---|---|---|
| Database | RDS automated snapshots + PITR | Continuous / daily | 35 days PITR, 90 days snapshots | eu-central-1, copy to eu-west-1 |
| Database, logical | `pg_dump` in a scheduled ECS task, encrypted with the escrowed key | Nightly | 30 daily, 12 monthly | S3 staging, then Azure Blob (immutable) |
| Driver documents | S3 versioning + AWS Backup | Continuous | While the driver is active | eu-central-1, Azure Blob copy nightly |
| Redis | Not backed up | — | — | Rebuilt from live traffic |
| Terraform state | S3 versioning; state KMS key escrowed | On change | 1 year of versions | S3, key in Azure Key Vault |
| Secrets | Secrets Manager versions + escrow of break-glass items | On change | — | AWS and Azure |

Monitoring: CloudWatch alarm if the nightly job fails; Azure Monitor alert if no
new blob arrives in 26 hours.
