// Where the containers will run in production. PLANNED: nothing is deployed.
// Instance counts and tiers are the MVP targets from docs/hopin-plan.md (C1, C5, C8).
// Client devices and the CDN that serves the web builds are not modelled yet;
// see the view register in README.md.

production = deploymentEnvironment "Production (planned)" {

    aws = deploymentNode "AWS account hopin-prod" "Primary provider" "Amazon Web Services" {

        euc1 = deploymentNode "eu-central-1 (Frankfurt)" "Primary region, 3 availability zones" "AWS region" {

            alb = infrastructureNode "Load balancer + WAF" "Terminates TLS, WSS idle timeout 300 s, managed rules and rate limits" "Application Load Balancer, AWS WAF" "Internet-exposed"

            ecs = deploymentNode "ECS cluster" "Private subnets across 2 AZs" "Amazon ECS on Fargate" {
                apiService = deploymentNode "api service" "Rolling deploy, circuit breaker, CPU target tracking" "ECS service" "" 2 {
                    apiInstance = containerInstance hopin.api
                }
                exporterTask = deploymentNode "backup-exporter" "Runs nightly, then exits" "ECS scheduled task" {
                    exporterInstance = containerInstance hopin.backupExporter
                }
            }

            rds = deploymentNode "RDS PostgreSQL" "Multi-AZ, CMK-encrypted, 35-day PITR" "Amazon RDS db.t4g.small" {
                dbInstance = containerInstance hopin.db
            }

            redis = deploymentNode "ElastiCache" "Single node, encrypted, no backup: rebuilt from live traffic" "Amazon ElastiCache for Redis" {
                cacheInstance = containerInstance hopin.cache
            }

            s3 = deploymentNode "S3 documents bucket" "Versioned, CMK-encrypted, public access blocked" "Amazon S3" {
                docStoreInstance = containerInstance hopin.docStore
            }

            backupVault = infrastructureNode "Backup vault" "Daily recovery points, Vault Lock" "AWS Backup"
        }

        euw1 = deploymentNode "eu-west-1 (Ireland)" "Cross-region copy target only" "AWS region" {
            backupCopy = infrastructureNode "Backup vault copy" "Copies of daily recovery points" "AWS Backup"
        }
    }

    azure = deploymentNode "Azure subscription hopin-secondary" "Off-provider recovery only; region to be fixed in S012" "Microsoft Azure" {

        blob = deploymentNode "Storage account" "Immutable (WORM) container, versioning, cool tier" "Azure Blob Storage" {
            offsiteInstance = containerInstance hopin.offsiteBackup
        }

        kv = deploymentNode "Key Vault" "Purge protection, soft delete, RBAC" "Azure Key Vault" {
            escrowInstance = containerInstance hopin.escrowVault
        }
    }

    production.aws.euc1.alb -> production.aws.euc1.ecs.apiService.apiInstance "Forwards HTTPS and WSS traffic to" "HTTP/1.1 + WebSocket"
    production.aws.euc1.backupVault -> production.aws.euc1.rds.dbInstance "Takes daily snapshots of" "AWS Backup"
    production.aws.euc1.backupVault -> production.aws.euc1.s3.docStoreInstance "Backs up" "AWS Backup"
    production.aws.euc1.backupVault -> production.aws.euw1.backupCopy "Copies recovery points to" "AWS Backup cross-region copy"
}
