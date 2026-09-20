# 4. Run the API on ECS Fargate

Date: 2026-09-19

## Status

Proposed

## Context

The API holds long-lived WebSocket connections from drivers and passengers. It
also runs background jobs and a nightly backup task.

## Decision drivers

- Long-lived connections.
- Low operational weight for a solo operator.
- Containers first, portable to Azure Container Apps for recovery (ADR 1).

## Considered options

1. ECS on Fargate.
2. AWS Lambda behind API Gateway.
3. Amazon EKS.

## Decision

We propose running the API as an ECS Fargate service behind an Application Load
Balancer, and the backup exporter as a scheduled ECS task.

## Consequences

Positive:

- No servers or cluster control plane to manage.
- The same image can run on Azure Container Apps in a recovery.

Negative / accepted trade-offs:

- Always-on tasks cost money even when idle.
- Lambda was rejected because its WebSocket model does not fit a stateful socket gateway.

## Risks

- None tracked yet.

## Related

- Requirements: plan Part C8.
- Architecture views: ProductionCore.
