# 8. Manage AWS and Azure infrastructure with Terraform

Date: 2026-09-19

## Status

Proposed

## Context

Both AWS and Azure resources must be created, reviewed and reproduced from code (ADR 1). The Azure restore path must be applied during drills.

## Decision drivers

- One tool and one mental model for both clouds.
- Plans reviewable in pull requests.

## Considered options

1. Terraform.
2. AWS CDK.

## Decision

We propose Terraform for both clouds, with state in S3 and deployments from GitHub Actions using OIDC.

## Consequences

Positive:

- One tool and module layout across providers.

Negative / accepted trade-offs:

- HCL is a second language beside TypeScript.
- AWS CDK was rejected because it does not cover Azure.

## Risks

- None tracked yet.

## Related

- Other ADRs: [1. AWS primary, Azure for recovery](0001-aws-primary-azure-for-off-provider-recovery.md).
