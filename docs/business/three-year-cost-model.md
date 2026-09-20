# Three-Year Cost Model

> **Status:** plan step S120, 2026-09-19. Estimates, not quotes. Every number
  comes from `scripts/cost_model.py` and the assumptions below; change both
  together and rerun it. Figures are million HUF per year unless marked.
>
> **Owner:** founder. **Review when:** a price in the assumptions changes, the
  scenario changes, or real usage exists.

## What the model says

1. **In the ambitious scenario the platform pays for itself and for you by year
   3.** Cash costs of 87.5 M HUF against revenue of 195.1 M HUF. After paying
   yourself a market salary, the three years together are 81.7 M HUF positive.
   Year 1 is negative once your time is counted: 15.7 M HUF is the price of
   building it.
2. **People, not cloud, are the cost.** AWS is 7.2 M HUF in year 3, about a
   third of one engineer. The two hires and your own time are almost 60 % of all
   three-year costs.
3. **Mapbox is the largest technology cost, almost five times all of AWS by year
   3.** Road-distance matching
   ([C-04](../architecture/requirements/constraints.md)) ranks ten candidate
   taxis per ride through the Matrix API, which alone is 24.6 M HUF in year 3.
   This is the first cost to engineer down; see
   [levers](#levers-and-decision-triggers).
4. **The smaller scenarios do not reach your target.** The base scenario roughly
   breaks even over three years; the conservative one loses 59.6 M HUF. The
   ambitious base case depends on 20 partners, which is
   [A-09](../architecture/requirements/assumptions.md) multiplied by twenty.

## Base case: ambitious

| Line (M HUF per year) | Year 1 | Year 2 | Year 3 | 3-year total |
|---|---|---|---|---|
| Platform rides per day (average) | 950 | 4,100 | 9,450 | — |
| AWS infrastructure (prod, staging, dev) | 1.4 | 3.6 | 7.2 | 12.2 |
| Mapbox (routing, matrix, geocoding, maps) | 1.8 | 13.4 | 34.1 | 49.3 |
| of which Matrix API for matching | 1.7 | 10.2 | 24.6 | 36.5 |
| Step Functions | 0.0 | 0.1 | 0.3 | 0.5 |
| SMS sign-in codes | 0.5 | 2.2 | 5.2 | 7.9 |
| Cognito | 0.0 | 0.9 | 2.7 | 3.7 |
| Expo EAS and Sentry | 0.6 | 0.8 | 0.8 | 2.1 |
| **Technology subtotal** | 4.3 | 21.1 | 50.3 | 75.7 |
| Legal and compliance | 3.3 | 0.8 | 0.8 | 4.9 |
| Security testing | 2.5 | 2.0 | 2.0 | 6.5 |
| Company and accounting | 0.9 | 1.4 | 2.4 | 4.8 |
| Stores, trademark, certification | 1.0 | 0.0 | 0.0 | 1.0 |
| Hires (engineer from Y2, partner support from Y3) | 0.0 | 21.7 | 31.9 | 53.6 |
| **Cash costs** | 12.0 | 47.0 | 87.5 | 146.5 |
| **Revenue** | 20.7 | 85.7 | 195.1 | 301.5 |
| **Cash result** | 8.7 | 38.7 | 107.6 | 155.0 |
| Founder at market rate (shown apart) | 24.4 | 24.4 | 24.4 | 73.2 |
| **Result after founder** | -15.7 | 14.3 | 83.2 | 81.7 |

**How precise this is.** The script prints one decimal, but the inputs are
judgements: read the results as whole millions at best. Year 1 assumes paying
cars from the first month, with no build period without revenue. A build period
would lower year 1 and the three-year result; it is not modelled.

## Sensitivity

| Scenario | Rides/day Y3 | Revenue Y1 / Y2 / Y3 | Cash costs Y1 / Y2 / Y3 | 3-year result after founder |
|---|---|---|---|---|
| Ambitious (base) | 9,450 | 20.7 / 85.7 / 195.1 | 12.0 / 47.0 / 87.5 | 81.7 |
| Base | 4,425 | 9.4 / 39.0 / 94.6 | 10.0 / 11.7 / 49.6 | -1.5 |
| Conservative | 2,560 | 3.0 / 13.7 / 34.5 | 9.7 / 8.7 / 19.1 | -59.6 |

The same prices and formulas apply to every scenario; only volume and hiring
differ ([A-10](../architecture/requirements/assumptions.md)): ambitious hires an
engineer in year 2 and partner support in year 3, base hires an engineer in year
3, conservative hires no one.

## Assumptions

| Input | Value | Source |
|---|---|---|
| Exchange rates | 400 HUF per EUR, 370 HUF per USD | Assumption |
| Scenario volumes (average cars; average Hopin-brand rides per day) | Ambitious 75 / 325 / 750 cars and 50 / 200 / 450 rides; base 30 / 130 / 350 and 25 / 100 / 225; conservative 15 / 75 / 210 and 5 / 20 / 40 | Founder, 2026-09-19 |
| Rides through the platform per partner car | 12 per day, app and phone orders | Assumption |
| White-label price | 10,000 HUF per car per month | [Business case](business-case.md) |
| Hopin-brand net per ride | 640 HUF after Stripe | [Business case](business-case.md) |
| Mapbox | Matrix $2 per 1,000 elements, Directions $2 per 1,000 requests, Temporary Geocoding $0.75 per 1,000, mobile $4 per 1,000 MAUs; each with a free tier (100,000; 100,000; 100,000; 25,000) | [Mapbox pricing](https://www.mapbox.com/pricing), read 2026-09-19 |
| Mapbox usage per ride | 10 matrix elements, 2 directions requests, 5 geocoding requests; one monthly active user per 4 rides | Assumption from the matching design |
| AWS | ~290 EUR/month below 2,000 rides a day (single-AZ, no NAT until the first partner, dev and staging included), ~750 below 6,000, ~1,500 above (larger database, replicated Redis, more tasks) | [Deployment architecture](../architecture/deployment/deployment-architecture.md#cost), scaled |
| Step Functions | 10 state transitions per ride at $0.025 per 1,000 | [ADR 12](../architecture/decisions/0012-payment-capture-workflow.md) |
| SMS sign-in codes | 0.3 messages per active user per month at 0.05 EUR | Assumption |
| Cognito | $0.01 per monthly active user above 10,000 | Estimate; confirm the tier in S026 |
| Expo EAS, Sentry | $99 and $26–80 per month | Published plans, rounded |
| Founder at market rate | 1.8 M HUF gross per month plus 13 % employer contribution | Assumption; senior cloud engineer, Budapest |
| Hires | Engineer 1.6 M HUF gross, partner support 0.75 M HUF gross, plus 13 % | Assumption ([A-10](../architecture/requirements/assumptions.md)) |
| Legal and compliance | Year 1: lawyer review 1.5, contracts 1.0, DPIA review 0.8; then 0.8 per year | Estimate; get quotes |
| Security testing | External penetration test 2.5 before launch, 2.0 per year | Estimate; get quotes |
| Company and accounting | Kft. setup 0.2; bookkeeping 60k then 120k HUF per month; audit 1.0 from year 3 | Estimate |
| Stores, trademark, certification | Apple $99 per year, Google $25 once; EU trademark in three classes 1,050 EUR; BKK certification 0.5 (fee not published) | [EUIPO fees](https://www.euipo.europa.eu/en/trade-marks/before-applying/fees-payments); others estimates |

Not included: the 3 M HUF minimum share capital of a Kft. (capital, not cost),
office, marketing and passenger acquisition, VAT, corporate tax, and dedicated
partner databases, which are passed through to the partner at cost ([ADR
9](../architecture/decisions/0009-hybrid-multi-tenancy.md)).

## Your income target

Your goal is 3 M HUF net per month, about 4.5 M HUF gross or 61 M HUF per year
in employer cost. In the ambitious case, year 3 has 107.6 M HUF of cash result
before paying you, so the target is affordable in year 3 with about 46 M HUF
left. In years 1 and 2 it is not: the platform pays its own costs, but not you
at that rate.

## Levers and decision triggers

| Lever | Effect | Trigger to act |
|---|---|---|
| Rank fewer taxis per ride through the Matrix API: pre-rank by straight line, send only the best 3 to Mapbox | Matrix cost down about 70 % | Mapbox spend passes AWS spend in any month; expected during year 1 of the ambitious case |
| Self-host routing (OSRM or Valhalla) for pre-ranking and directions; keep Mapbox only for traffic-aware ETAs | Directions and most matrix calls become a fixed ~200 EUR per month | Mapbox above 1 M HUF per month. Needs a legal check: Budapest requires current traffic ([C-04](../architecture/requirements/constraints.md)), which self-hosted routing lacks. |
| Longer sessions and passkeys | SMS cost down; fewer sign-in codes | SMS above 300,000 HUF per month |
| Cheap year-1 shape (single-AZ, no NAT) until the first paying partner | ~90 EUR per month saved; meets [QA-08](../architecture/requirements/quality-attributes.md) | In place from launch; switch to full shape when the first partner goes live |

The routing cost is tracked as [RISK-019](../architecture/risks/architecture-risks.md). Whichever lever is chosen gets an ADR.
