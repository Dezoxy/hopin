# Environments

| Environment | AWS account | Purpose | Data | Shape |
|---|---|---|---|---|
| `dev` | hopin-dev | Every merge to `main` deploys here | Synthetic only | Single-AZ RDS, no NAT, Fargate Spot, scaled to zero overnight (~50 EUR/month) |
| `staging` | hopin-staging | Release candidates; TestFlight and Play internal builds point here | Synthetic plus beta testers | Production shape at minimum size |
| `prod` | hopin-prod | Real users | Real | As in [deployment-architecture.md](deployment-architecture.md) |
| — | hopin-management | AWS Organization root, IAM Identity Center, billing, organisation CloudTrail | None | No workloads |

Azure: one tenant and one subscription, `hopin-secondary`, with resource groups `rg-hopin-backup` and `rg-hopin-vault`. Region to be chosen in plan step S012 (West Europe or Germany West Central).

Service control policies deny regions outside the EU and use of the root user in every account (plan step S011).
