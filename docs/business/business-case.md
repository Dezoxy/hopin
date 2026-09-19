# Business Case

> **Scenario.** Since 2026-09-19 Hopin is a reference architecture case study, not a business being started. This business case is kept as the worked business scenario the architecture answers to; it will not be executed.
>
> **Status:** first version, 2026-09-19, from a working session with the founder. Numbers are estimates; the interviews and partner conversation that would have tested them (S117, S118) were dropped with the reframe.
>
> **Owner:** founder. **Review when:** the scenario changes, or the three-year cost model (S120) needs a revenue side.

## Summary

Hopin is sold first as a **white-label dispatch platform** to licensed Hungarian taxi dispatch companies, and second as the **Hopin consumer brand** on the same platform. The white-label route avoids the 100 M HUF equity Hopin would need as its own Budapest dispatch ([RISK-001](../architecture/risks/architecture-risks.md)) and hands passenger acquisition to partners who already have passengers.

## Why not just compete with Bolt

- Bolt takes 20 % of each fare from drivers (founder's driver contacts). Hopin at 15 % is cheaper for drivers, but Bolt can match that at any time. Price is not a moat.
- Drivers are not the bottleneck; passengers are. Drivers use several apps at once and take whichever rings first. A third consumer app in Budapest needs expensive passenger acquisition that Bolt has already paid for.
- Since 1 July 2026, every Budapest dispatch service must give passengers a downloadable fare-check app and use BKK-certified dispatch software ([C-06](../architecture/requirements/constraints.md)). Many smaller dispatch companies have a phone line and radio, not an app team. Hopin is built to that exact specification.

## Revenue models

| Model | Who pays | Price basis | Status |
|---|---|---|---|
| White-label platform | Dispatch company | Per car per month, or per ride; decided in the first partner conversation | Primary |
| Hopin consumer brand | Driver | 15 % of the metered fare | Secondary |

### White-label price anchors

| Offer | Price | Notes |
|---|---|---|
| TaxiCaller | $28 per car per month, no setup fee | Published price |
| Yelowsoft | From $149 per month plus $999 setup | Published price |
| Hungarian custom build | From 12 M HUF net, up to 18–25 M HUF | One Hungarian agency's published range |
| Bolt Dispatcher | Web-based, no setup cost; price not published | Competes directly |

A starting position for the first conversation: **around 10,000 HUF per car per month**, below TaxiCaller, including the certified passenger app they are now legally required to offer. A partner with 50 cars would pay 500,000 HUF a month.

### Consumer unit economics

| Item | Value |
|---|---|
| Typical Budapest ride (6 km, 15 min) at the official tariff | ~5,500 HUF |
| Hopin take at 15 % | ~825 HUF |
| Stripe fee on the whole fare (~1.5 % plus fixed part) | ~180 HUF |
| Hopin keeps per ride | ~640 HUF |

Stripe takes over a fifth of the commission because it processes the whole fare. This is structural under a fixed tariff.

A fare that finally fails to capture is carried by the partner up to a monthly cap in the partner contract; above the cap Hopin and the partner split it, and the driver is always paid ([ADR 12](../architecture/decisions/0012-payment-capture-workflow.md)).

## Target and break-even

Founder's goal: the platform pays its own infrastructure and yields **3 M HUF net per month** to the founder. That needs about **5 M HUF revenue per month** after infrastructure, taxes and dividend costs (estimate; confirm with an accountant).

| Route to 5 M HUF / month | Needed |
|---|---|
| Consumer brand only | ~7,800 rides a month, ~260 a day |
| White-label only | ~500 cars across partners at 10,000 HUF |
| Mix | For example 2 partners with 150 cars total (1.5 M) plus ~180 consumer rides a day (3.5 M) |

With 20 drivers using Hopin alongside Bolt at 2–3 Hopin rides each per day, the consumer brand yields about 800,000 HUF a month. That covers infrastructure and proves the product. It is about a quarter of the target, and the gap is passengers.

## One-month goal

The founder wants a result within one month. One month cannot produce a launchable service: lawyer review, a partner agreement, BKK certification and app store review each take weeks and are not engineering work. The one-month goal is therefore:

1. A working pilot build that the founder's ~20 driver contacts try alongside Bolt.
2. Five driver interviews completed ([interview guide](driver-interview-guide.md)).
3. One signed letter of intent from a dispatch company.

## Language

The pilot UI is English only, by founder decision. **Concern:** Budapest drivers and most passengers are Hungarian speakers, and a dispatch partner will expect Hungarian. The apps must still be built with translatable strings from day one (plan step S007) so adding Hungarian is a translation task, not a rewrite.

## Name

"Hopin" collides with a known London-based events platform ([RISK-014](../architecture/risks/architecture-risks.md)). Backup name: **Gurul** ("it rolls" in Hungarian): short, pronounceable in English, no taxi app found under that name, and `gurul.com` appeared unregistered on 2026-09-19. `gurul.hu` is taken. An EU trademark search in classes 9, 39 and 42 is required before either name is used publicly.

## Three-year view

Costs, revenue and results over three years for three scenarios are in the [three-year cost model](three-year-cost-model.md).

## Sources

- [TaxiCaller pricing](https://www.taxicaller.com/en/pricing)
- [Yelowsoft pricing](https://www.yelowsoft.com/pricing/)
- [AppSolution: taxi app development prices in Hungary](https://app-arak.hu/taxi-applikacio-fejlesztes)
- [Bolt dispatcher software for taxi companies](https://bolt.eu/hu/dispatcher-software/)
- [BKK: app for safer taxi use (June 2026)](https://bkk.hu/hirek/2026/06/alkalmazassal-segiti-a-bkk-a-biztonsagos-taxizast.16701/)
- [Hopin (company)](https://en.wikipedia.org/wiki/Hopin_(company))
