# Disaster Recovery

Objectives: [QA-04](../requirements/quality-attributes.md). **No restore has been performed yet**; every objective below is a target without evidence until plan step S096 records the first drill.

Views: **RegionRecovery** and **AccountRecovery**.

| Scenario | RPO | RTO | Path |
|---|---|---|---|
| Bad deploy or data corruption | 5 min | 1 h | PITR to a new instance, repoint the API |
| eu-central-1 lost | 24 h (last copied snapshot) | 4 h | Restore snapshot copy in eu-west-1; apply Terraform for eu-west-1 |
| AWS account lost (compromise, lock-out) | 24 h | 24 h | Restore nightly dump into Azure Database for PostgreSQL; run the API image on Azure Container Apps (plan step S097) |

## Outline for the AWS-account-loss path

1. Declare the incident; freeze all remaining AWS access.
2. Retrieve break-glass credentials and the dump key from Azure Key Vault.
3. Apply the Azure cold-restore Terraform module.
4. Decrypt and restore the latest dump.
5. Stand up the replacement identity (Entra External ID). Users and partner staff re-enrol by SMS code against the phone numbers restored from the dump ([RISK-017](../risks/architecture-risks.md)).
6. Deploy the API image, repoint DNS, rotate every third-party key.
7. Run the capture fallback: a batch script over unfinished `ride.completed` outbox entries, with the same idempotency keys, because Step Functions is not available on Azure ([ADR 12](../decisions/0012-payment-capture-workflow.md)).
8. Reconcile payments against Stripe for the lost window.

Step-by-step commands belong in `docs/runbooks/restore.md` (plan step S096), not here.

## Evidence

| Date | Scenario | Measured RPO | Measured RTO | Notes |
|---|---|---|---|---|
| — | No drill yet | — | — | First drill: plan step S096 |
