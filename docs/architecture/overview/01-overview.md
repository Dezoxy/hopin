# Hopin

## Overview

Hopin is a white-label dispatch platform for licensed Hungarian taxi companies,
with a Hopin-branded consumer app second. Passengers book in a few taps, see a
fare estimate before the ride, follow the driver live, share the trip with
someone they trust and pay in the app. Drivers are licensed taxi drivers, and
the charged fare is the taxi-meter amount at the official tariff
([C-02](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/constraints.md)).

**Status: target architecture. Nothing here is built, deployed or operated.**
This is a reference architecture case study. Every statement is documented
intent from [the plan](https://github.com/Dezoxy/hopin/blob/main/docs/hopin-plan.md)
and the ADRs, not observed behaviour. The one exception is a thin running slice,
which produced the first real measurements
([slice results](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/evidence/s123-slice-results.md)).

This page is a map, not a manual. The **Decisions** tab records why the platform
looks the way it does. Four reading paths follow this map as their own sections:
**For stakeholders**, **For the CTO**, **For engineers** and **For operators**.

![Context view: who uses Hopin and which outside services it relies on](embed:Context)

## Building blocks

Four clients and one API, with the stores and managed services the API depends
on.

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
| Payment Workflow | One capture workflow per ride: capture, wait, retry, report | AWS Step Functions |
| Monitoring | Logs, metrics, traces, alarms, paging | CloudWatch, X-Ray, SNS |
| Backup Exporter | Nightly encrypted copy to Azure | Scheduled container task |
| Off-provider Backup | Immutable copies outside AWS | Azure Blob Storage |
| Escrow Vault | Dump key and break-glass credentials | Azure Key Vault |

![Clients view: the four client apps and how each reaches the API](embed:Clients)

![Backend view: what the Hopin API depends on to do its work](embed:Backend)

## Key characteristics

- All live traffic runs in AWS eu-central-1. Azure only holds recovery copies
  and keys
  ([ADR 1](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0001-aws-primary-azure-for-off-provider-recovery.md)).
- PostgreSQL is the system of record. Redis holds only data that can be rebuilt
  ([ADR 3](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0003-nestjs-postgresql-postgis.md),
  [ADR 5](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0005-redis-socketio-realtime.md)).
- Card data goes from the app straight to Stripe and never reaches Hopin
  ([ADR 7](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0007-stripe-connect-payments.md)).
- One platform serves every partner, and the database itself keeps each
  partner's data apart
  ([ADR 9](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0009-hybrid-multi-tenancy.md),
  [ADR 10](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0010-one-app-for-all-partners.md)).
- The trip-share page reads a ride's position with a revocable token and no
  login. The token is the only access control on that path.
- Personal data stays in EU regions.

## Principles and requirements

Targets, not results. All thirteen quality attributes are stated as measurable
numbers with an architectural consequence; four of them have a first local
measurement from the slice and none has been measured in a deployed
environment.

- [Architecture principles](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/principles/architecture-principles.md)
- [Constraints](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/constraints.md)
- [Quality attributes](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/quality-attributes.md)
- [Assumptions](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/assumptions.md)

## Risks and roadmap

The largest risks are commercial, not technical: the whole revenue model rests
on partners paying about 10,000 HUF per car per month, the plan needs twenty of
them, and none has signed
([A-09](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/assumptions.md)),
and the legal reading is not legal advice
([A-02](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/assumptions.md)).
Of the technical ones, two stand out: no restore path has ever been drilled, so
the recovery targets are designed rather than demonstrated
([RISK-009](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/risks/architecture-risks.md)),
and one person cannot cover nights while partners must by law keep dispatching
([RISK-022](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/risks/architecture-risks.md)).

- [Architecture risks](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/risks/architecture-risks.md)
- [Transition plan](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/roadmap/transition-plan.md)
- [Executive summary](https://github.com/Dezoxy/hopin/blob/main/docs/executive-summary.md): the decision memo and its three gates

## What the design process found

Twelve problems were found before any production code existed: two by reading
the law, one by drawing a view, one in design review, one while costing, three
by running the slice, three in code review and one by checking a vendor's
documentation. The pattern is that the cheap methods found the expensive
problems — reading the taxi law changed the business model, and costing changed
the matching design — while running code found what design could not, such as a
shutdown race and a cross-partner offer bug.

- [Design findings](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/evidence/design-findings.md): all twelve, with how each was caught and what changed
- [Slice results](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/evidence/s123-slice-results.md): the first measurements
- [Retrospective](https://github.com/Dezoxy/hopin/blob/main/docs/retrospective.md): what I would do differently, and what is still weak
