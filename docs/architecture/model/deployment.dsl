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
            ecr = infrastructureNode "Image registry" "Scan on push, last 20 images kept" "Amazon ECR"
            tfState = infrastructureNode "Terraform state" "Versioned bucket with a lock table; key escrowed in Azure" "Amazon S3, DynamoDB"
        }

        euw1 = deploymentNode "eu-west-1 (Ireland)" "Cross-region copy target only" "AWS region" {
            backupCopy = infrastructureNode "Backup vault copy" "Copies of daily recovery points" "AWS Backup"
        }
    }

    github = deploymentNode "GitHub" "Public repository with a protected main branch" "GitHub" {
        actions = infrastructureNode "GitHub Actions" "Tests on every pull request; deploys on merge and tags" "GitHub Actions"
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
    production.github.actions -> production.aws.euc1.ecr "Pushes scanned images to" "OIDC role, no stored keys"
    production.github.actions -> production.aws.euc1.tfState "Plans and applies infrastructure with state in" "Terraform, OIDC role"
    production.github.actions -> production.aws.euc1.ecs.apiService.apiInstance "Rolls out new task definitions to" "ECS deploy, circuit breaker"
    production.aws.euc1.ecs.apiService.apiInstance -> production.aws.euc1.ecr "Pulls its image from" "HTTPS via VPC endpoint"
}

// Recovery targets. Designed, never exercised: evidence goes into
// reliability/disaster-recovery.md after the first drill (plan S096).

regionRecovery = deploymentEnvironment "Recovery: eu-west-1 (planned)" {
    aws = deploymentNode "AWS account hopin-prod" "Same account, second region" "Amazon Web Services" {
        euw1 = deploymentNode "eu-west-1 (Ireland)" "Built by Terraform during recovery" "AWS region" {
            alb = infrastructureNode "Load balancer + WAF" "Same rules as production" "Application Load Balancer, AWS WAF" "Internet-exposed"
            ecs = deploymentNode "ECS cluster" "Private subnets" "Amazon ECS on Fargate" {
                apiService = deploymentNode "api service" "Same image as production" "ECS service" "" 2 {
                    apiInstance = containerInstance hopin.api
                }
            }
            rds = deploymentNode "RDS PostgreSQL" "Restored from the latest copied snapshot" "Amazon RDS" {
                dbInstance = containerInstance hopin.db
            }
            redis = deploymentNode "ElastiCache" "Empty; rebuilt from live traffic" "Amazon ElastiCache for Redis" {
                cacheInstance = containerInstance hopin.cache
            }
        }
    }
    regionRecovery.aws.euw1.alb -> regionRecovery.aws.euw1.ecs.apiService.apiInstance "Forwards HTTPS and WSS traffic to" "HTTP/1.1 + WebSocket"
}

accountRecovery = deploymentEnvironment "Recovery: Azure cold restore (planned)" {
    azure = deploymentNode "Azure subscription hopin-secondary" "Used only when the AWS account is lost" "Microsoft Azure" {
        apps = deploymentNode "Container Apps environment" "Built by the cold-restore Terraform module (S097)" "Azure Container Apps" {
            apiInstance = containerInstance hopin.api
        }
        pg = deploymentNode "PostgreSQL flexible server" "Restored from the latest encrypted dump" "Azure Database for PostgreSQL" {
            dbInstance = containerInstance hopin.db
        }
        redis = deploymentNode "Azure Cache for Redis" "Empty; rebuilt from live traffic" "Azure Cache for Redis" {
            cacheInstance = containerInstance hopin.cache
        }
        blob = deploymentNode "Storage account" "Source of the dumps" "Azure Blob Storage" {
            offsiteInstance = containerInstance hopin.offsiteBackup
        }
        kv = deploymentNode "Key Vault" "Dump key and break-glass credentials" "Azure Key Vault" {
            escrowInstance = containerInstance hopin.escrowVault
        }
        restore = infrastructureNode "Restore job" "Run by the operator from the restore runbook (S096)" "Container Apps job, pg_restore"
        entra = infrastructureNode "Replacement identity" "Cognito is lost with the AWS account; users re-enrol by SMS code (RISK-017)" "Microsoft Entra External ID"
    }
    accountRecovery.azure.restore -> accountRecovery.azure.kv.escrowInstance "Fetches the dump key from" "Managed identity"
    accountRecovery.azure.restore -> accountRecovery.azure.blob.offsiteInstance "Reads the latest encrypted dump from" "Managed identity"
    accountRecovery.azure.restore -> accountRecovery.azure.pg.dbInstance "Restores the dump into" "pg_restore over TLS"
    accountRecovery.azure.apps.apiInstance -> accountRecovery.azure.entra "Validates access tokens against" "OIDC/JWKS"
}
