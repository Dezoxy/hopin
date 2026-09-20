# 1. Use AWS as the primary cloud and Azure only for off-provider recovery

Date: 2026-09-19

## Status

Accepted

## Context

Hopin is built and run by one person in Hungary. The owner wants hands-on use of
both AWS and Azure. Running the live service on two clouds would double the
identity, network, infrastructure-as-code and on-call surface.

For a solo operator the realistic catastrophe is losing the primary account
itself: compromise, billing lock-out or a provider-wide incident. Same-provider
backups do not survive that.

## Decision drivers

- Solo operability: one production platform to run and debug.
- Recovery from loss of the primary provider (plan Part C4, C5).
- EU data residency for all personal data (plan A7).
- Cost ceiling for an idle MVP (plan A7, C8).

## Considered options

1. AWS only.
2. Azure only.
3. AWS primary, Azure secondary for backups, secret escrow and a documented
   cold-restore path.
4. Active or warm standby on Azure.

## Decision

We will run everything users touch on AWS in eu-central-1. Azure holds immutable
encrypted copies of the database and driver documents, the dump encryption key
and escrowed break-glass credentials. The Azure restore path is a runbook and
Terraform module, not a running environment. It counts as working only after a
restore drill ([RISK-009](../risks/architecture-risks.md)).

## Consequences

Positive:

- A single live platform to operate.
- Backups and keys survive loss of the AWS account.
- Both clouds are used for a real purpose.

Negative / accepted trade-offs:

- Recovery onto Azure is slow (target 24 h) and needs a drill to be trusted.
- Two identity systems and two bills, although Azure's is small.
- The backup exporter needs a credential for Azure stored in AWS.

## Risks

- Restore path rots if not drilled; plan step S096 schedules drills.
- Scope creep into a live Azure standby; revisit only at plan step S110.

## Related

- Requirements: plan Part A7, Part C4, Part C5.
- Architecture views: OffProviderRecovery, AwsBackups, AzureRecovery.
- Other ADRs: [8. Terraform for both clouds](0008-terraform-for-both-clouds.md).
