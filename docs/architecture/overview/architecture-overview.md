# Architecture Overview

> **Status:** target architecture for the MVP. Nothing is built or deployed yet. Every statement is documented intent from [the plan](../../hopin-plan.md) and the ADRs, not observed behaviour.

## Purpose

Hopin is a ride-hailing app for short city trips. Passengers book in a few taps, see a fare estimate before the ride, follow the driver live, share the trip with someone they trust and pay in the app. Drivers are licensed taxi drivers, and the charged fare is the taxi-meter amount at the official tariff ([C-02](../requirements/constraints.md)).

## Context

Passengers, drivers and the operator each use their own client. The Hopin API does the work and relies on three outside services: Stripe for payments and driver payouts, Mapbox for maps and routes, and Expo Push for notifications.

See the **Context** view.

## Building blocks

| Container | Responsibility | Technology |
|---|---|---|
| Passenger App | Booking, live tracking, payment, sharing, rating | React Native, Expo (iOS, Android, Web) |
| Driver App | Onboarding, going online, offers, running the ride | React Native, Expo (iOS, Android) |
| Admin Web | Driver approval, live operations, refunds, settings | Next.js static export |
| Trip-share Page | Public live position of a shared ride | Static web page |
| Hopin API | Quotes, matching, ride lifecycle, realtime, payments, jobs | NestJS, Socket.IO |
| Identity | Phone sign-in, role groups | Amazon Cognito |
| Hopin Database | System of record | PostgreSQL 16, PostGIS |
| Realtime Cache | Live driver positions, socket fan-out, job queues | Redis |
| Document Store | Driver documents, staged dumps | Amazon S3 |
| Secrets Store | Credentials and API keys | AWS Secrets Manager |
| Monitoring | Logs, metrics, traces, alarms, paging | CloudWatch, X-Ray, SNS |
| Backup Exporter | Nightly encrypted copy to Azure | Scheduled container task |
| Off-provider Backup | Immutable copies outside AWS | Azure Blob Storage |
| Escrow Vault | Dump key and break-glass credentials | Azure Key Vault |

See the **Clients**, **Backend** and **OffProviderRecovery** views. Inside the API, ten components carry the work; see **ApiRideFlow**, **ApiMoneyAndCompliance** and **PartnerConsole**.

## Key characteristics

- All live traffic runs in AWS eu-central-1. Azure only holds recovery copies and keys ([ADR 1](../decisions/0001-aws-primary-azure-for-off-provider-recovery.md)).
- PostgreSQL is the system of record. Redis holds only data that can be rebuilt ([ADR 3](../decisions/0003-nestjs-postgresql-postgis.md), [ADR 5](../decisions/0005-redis-socketio-realtime.md)).
- Card data goes from the app straight to Stripe and never reaches Hopin ([ADR 7](../decisions/0007-stripe-connect-payments.md)).
- The trip-share page reads a ride's position with a revocable token and no login. The token is the only access control on that path.
- Personal data stays in EU regions.
