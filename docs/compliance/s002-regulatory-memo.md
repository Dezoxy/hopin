# S002 — Regulatory memo: running a taxi app in Hungary

> **Status:** research memo, 2026-09-19. **Not legal advice.** Statute texts
  were read on this date from the consolidated versions linked in
  [Sources](#sources). A Hungarian lawyer must confirm the conclusions before
  money is committed (see [Open questions](#open-questions-for-a-lawyer)).
>
> **Owner:** founder. **Review when:** the Budapest taxi decree, Government
  Decree 176/2015 or the Act on passenger transport services changes; before
  choosing the launch model (plan Part F, question 7).

## Bottom line

1. **Hopin legally is a taxi dispatch service ("diszpécserszolgálat").** The
   national definition explicitly covers mediating rides "through computer
   applications". Only licensed taxis with a certified taxi meter may do the
   rides. Private-car ride-sharing like early Uber is not allowed.
2. **In Budapest, a dispatch service needs at least 100 million HUF of equity**,
   plus 25,000 HUF per car above 400. Its dispatch software must also be
   certified by BKK, the Budapest transport authority. This is the single
   biggest finding: a solo founder cannot launch a Budapest dispatch service as
   planned.
3. **The fare cannot be set by the app.** In Budapest the payable fare is only
   what the taxi meter computes, and the three unit rates are fixed official
   prices. Hopin can show an estimate before the ride, but it cannot offer a
   binding upfront price, discounts or surge.
4. **The driver's business, not Hopin, issues the passenger's receipt or
   invoice.** Hopin invoices its own service fee to drivers, and those invoices
   are reported to NAV. From 1 September 2026, receipt data must also be
   reported to NAV within three days.
5. **A data-protection impact assessment (DPIA) is mandatory.** Real-time
   location tracking of passengers and drivers is on the Hungarian
   data-protection authority's (NAIH) mandatory list.

The plan's product vision still works. The **market-entry model** has to change.
See [Options](#market-entry-options).

## 1. Licensing

### National rules — Government Decree 176/2015 (VII. 7.)

| Topic | Rule | Where |
|---|---|---|
| What Hopin is | "diszpécserszolgálat: személyszállító szolgáltatási feladatot – közvetlenül vagy közvetve, számítástechnikai alkalmazások közbeiktatásával … – közvetítő és szervező szolgálat" | § 2 point 1 |
| Independent dispatch | A dispatch service that does not transport people itself is an "önálló diszpécserszolgálat" | § 2 point 2 |
| Licence | Needs a "diszpécserszolgálati engedély" from the transport authority. Valid 5 years, renewable. The authority publishes licence holders. | § 17 (1), (1b), (2) |
| People | Same personal reliability and professional competence rules as a taxi company. A professional manager ("szakmai irányító") must pass the taxi entrepreneur exam at KAV. | § 17 (1), § 6, § 7 |
| Financial guarantee | 1 M HUF up to 20 cars, 2 M up to 50, 3 M up to 100, 5 M up to 150, 10 M up to 200, 20 M above 200, **unless the municipality sets otherwise** | § 17 (4) |
| Business terms | Written business terms under Civil Code standard-terms rules, displayed in vehicles | § 23 (1)–(2) |
| What a taxi is | A car "viteldíjjelző készülékkel ellátott" (fitted with a taxi meter), 4–6 passengers | § 2 point 7 |
| Taxi car | Certified receipt-issuing taxi meter, fare table in the car, TAXI roof sign, yellow plates | Annex, point 2 |
| Ride-sharing | "Személygépkocsis személyszállító szolgáltatás" (white plates, no meter) is allowed only as part of another service such as a hotel, event or airport contract. It is not usable for on-demand city rides. | § 22 (2) |

The Act on passenger transport services (Act XLI of 2012, "Sztv.") lets the
transport authority order unlicensed dispatch apps to be made **temporarily
inaccessible**. This is the 2016 rule that pushed Uber out of Hungary.

### Budapest rules — Budapest Assembly Decree 31/2013 (IV. 18.), as amended (latest by 24/2025 (X. 6.))

| Topic | Rule | Where |
|---|---|---|
| Equity | "A szolgálat pénzügyi szempontból akkor megfelelő, ha a saját tőkéje eléri a 100 millió forint összeget", plus 25,000 HUF per car above 400. Annual accounts sent to BKK every June 15. | § 5 (2)–(3) |
| Before the licence | Documents to BKK for a preliminary certificate: company extract, no public debt, phone subscription in its own name, proof the dispatch software complies | § 4 (1) |
| Continuous dispatch | Must run a continuous dispatch service that records orders and passes them to drivers; orders kept in a computer register | § 4 (2)–(3) |
| Phone orders | At least one phone subscription; the software must record orders by phone, fax, email, letter and online | § 4 (4), (6) e) |
| Software rules | Map-based; car devices report position at least **every 5 seconds, accurate to 20 m**, with heading and two-way data | § 4 (6) a)–b) |
| Matching | Must pick the best free taxi **automatically**, by location, heading, distance and time, using **real road distance with current traffic**, not straight-line distance | § 4 (6) c) |
| Order display | Shows the exact pickup address and time in the car with an audible alert, or sends it to the car's navigation | § 4 (6) d) |
| Driver alarm | Receives a driver's attack or accident alarm with live location in the control centre, so authorities can be alerted | § 4 (6) f) |
| Fare check | Provides a downloadable passenger app in which "az utas ellenőrizheti a viteldíj-képzés szabályszerűségét" (the passenger can check the fare was formed correctly) | § 4 (6) g) |
| Certification | BKK certifies the software; a dispatch service may only use certified software | § 4 (7)–(8) |
| Taxi live data | The taxi operator reports the taxi's position and meter start/stop to BKK **in real time** by software | § 3 (18) |
| Card payment | Every taxi must accept domestic and international cards at no extra charge. If the fare is paid to the dispatch service's account, each payment must be traceable to the car's plate. | § 3 (10a)–(10b) |
| Taxi stands | Without a Budapest taxi-stand permit, a taxi may only take pre-booked written orders | § 3 (13a) |

## 2. Fares

| Rule | Where |
|---|---|
| The meter forms the fare from base fee, per-km and per-minute rate only | Budapest § 15 (1), (4) |
| "Fizetendő viteldíjként kizárólag a taxaméter által … képzett összeg állapítható meg" — only the meter amount can be charged | Budapest § 15 (5) |
| For a booked ride the meter starts at the agreed time, if the taxi is at the pickup address then | Budapest § 15 (6) |
| Per-minute rate applies only below 15 km/h | Budapest § 15 (3) |
| Unit rates are **mandatory fixed official prices** ("rögzített hatósági ár"), VAT included | Budapest § 16 (1) |

**Budapest official tariff since 2026-08-01:**

| Item | Amount |
|---|---|
| Base fee | 1,300 HUF |
| Per km | 520 HUF |
| Per minute (below 15 km/h) | 130 HUF |
| Base fee to or from Budapest Airport | 2,100 HUF, on the meter's second tariff |

Consequences for Hopin:

- **Upfront fare is an estimate only.** It is useful and allowed as information,
  but the charged amount must equal the meter amount.
- **No discounts, promo codes or surge in Budapest.** Fixed prices rule out both
  directions.
- **No passenger booking or service fee.** Only the three tariff items may be
  charged. Hopin earns from drivers.
- **A passenger cancellation fee is doubtful.** It is not a tariff item. For
  booked rides, the meter-start rule in § 15 (6) is the lawful way to charge
  waiting. A lawyer should confirm.
- **Tips** are not a fare element. Voluntary tips appear possible but need confirmation.

## 3. Receipts, invoices and NAV

| Obligation | Who | Notes |
|---|---|---|
| Receipt to the passenger | Taxi operator (the driver's business) | Issued by the certified taxi meter or online cash register. Not Hopin. |
| Invoice to the passenger on request | Taxi operator | Invoicing software or invoice book; no meter receipt for invoiced rides |
| Invoice reporting (Online Számla) | Whoever issues invoices to Hungarian taxpayers | Mandatory since 2020 |
| Receipt data reporting | Everyone who issues receipts | **From 2026-09-01**, receipt data goes to NAV within 3 days. NAV does not fine until 2026-12-31. Private passengers who don't ask for an invoice can be given an e-receipt. |
| Hopin's service fee | Hopin | Hopin invoices drivers for its fee; these B2B invoices are reported through Online Számla |
| Platform reporting (DAC7) | Hopin | Ride-hailing counts as "personal services". Hopin must report drivers' income to NAV yearly; fines up to 2 M HUF. |

### Invoicing provider

Hopin needs an invoicing API for **its own** fee invoices to drivers, and
possibly self-billing on drivers' behalf, which requires a written agreement
with each driver.

| Candidate | Why it is on the list |
|---|---|
| Számlázz.hu | Market leader; API; Online Számla reporting; publishes receipt-reporting guidance |
| Billingo | API; Online Számla reporting; publishes e-receipt guidance |

**Recommendation:** decide in plan step S047, after the entry model (Part F,
question 7). Who issues invoices depends on it. Selection criteria are an API
that can issue invoices on behalf of many drivers, e-receipt and receipt-data
support, and an EU data location.

## 4. Data protection

- **A DPIA is mandatory before launch.** NAIH's Article 35(4) list includes
  location data used for systematic monitoring. Hopin tracks drivers
  continuously and passengers during rides.
- **Location is also collected by law.** Budapest requires 5-second positions
  and real-time reporting to BKK. The DPIA must separate legally required
  processing from Hopin's own purposes.
- **Retention:** dispatch order records must be kept for the period the Sztv.
  sets. The exact period was not confirmed in this research; the lawyer must
  confirm it before plan step S100 fixes retention jobs.
- **Algorithmic management:** automatic matching is algorithmic management of
  drivers. The EU Platform Work Directive (2024/2831) must be transposed by
  **2026-12-02**, but Hungary had not started as of May 2026. Expect
  transparency and human-review duties for matching and account suspension.

### DPIA outline (to be written in S100)

1. Processing description: data subjects (passengers, drivers, trip-share
   viewers, operator), data categories, purposes, legal bases, recipients (BKK,
   NAV, Stripe, Mapbox, Expo, AWS, Azure, Sentry).
2. Necessity and proportionality: minimum location precision and frequency
   beyond legal duties, retention per category, trip-share expiry.
3. Risks: stalking through trip-share links, profiling of drivers, location
   leaks, cross-border transfers, account takeover.
4. Measures: tokenised expiring share links, encryption, access logging, EU-only
   storage, data processing agreements, driver transparency notice, human review
   of suspensions.
5. Residual risk and whether NAIH must be consulted in advance.
6. Sign-off and review triggers.

## Market-entry options

| Option | What it means | Main cost or risk | Fit for a solo founder |
|---|---|---|---|
| A. Own dispatch licence in Budapest | Hopin becomes a licensed Budapest dispatch service | 100 M HUF equity, BKK certification, professional manager, office phone line | Poor, unless funded |
| B. Launch in another Hungarian city | National licence and a small guarantee (1 M HUF up to 20 cars), plus that city's own decree | City decree may add conditions; smaller market | Possible; needs a city-decree check |
| C. Technology provider to a licensed Budapest dispatch | Hopin builds and runs the software; an existing licensed dispatch is the legal operator | Revenue share, partner dependency, their brand may lead | Good; smallest regulatory load |
| D. Launch outside Hungary | Another EU market with lighter rules | Different law, language and market; loses home advantage | Out of the plan's scope |

**Recommendation: C to start, keeping B open.** C gets a real product in front
of Budapest drivers without 100 M HUF equity, and every Budapest software rule
becomes a product requirement either way. B is the path if no partner fits. This
is a business decision for you, so it is question 7 in plan Part F.

## Impact on the plan and architecture

| Plan area | Change |
|---|---|
| A3 fare | "Fare shown before the trip" becomes a **fare estimate**; the charge equals the meter amount |
| A4 | Promo codes, surge and discounts are **not allowed** in Budapest, not just deferred |
| S004 fare model | Use the official tariff table, versioned by effective date and city |
| S031 matching | Must choose the best taxi by **road distance and traffic** automatically. Redis GEO stays as a pre-filter only. |
| S033 realtime | Driver position every **≤ 5 s at ≤ 20 m**; the plan's 3 s target already meets this |
| S043 charging | Authorise an estimate buffer, capture the **meter amount**. Needs a way to get the meter amount: taxi-meter integration or driver entry with checks. |
| S046 cancellation | Replace the passenger cancellation fee with lawful waiting via the booked-ride meter-start rule, pending lawyer view |
| S047 receipts | Hopin sends a ride summary. The legal receipt comes from the driver's meter or e-receipt. Hopin invoices its fee to drivers. |
| S055 / S067 | Add a **driver alarm** to the control centre, next to the passenger SOS |
| S058 / S057 | Add a **fare check** screen for the passenger (meter data versus official tariff) |
| New | BKK real-time data feed (position, meter start/stop); phone-order intake; DAC7 yearly report |

Architecture constraints C-01 to C-09 in
[constraints.md](../architecture/requirements/constraints.md) carry these facts
into the architecture.

## Open questions for a lawyer

1. Can Hopin run as software provider to a licensed dispatch (option C) without
   its own dispatch licence, and who must hold the BKK software certificate?
2. Is a passenger cancellation or no-show fee lawful for Budapest taxi dispatch?
   Are voluntary in-app tips lawful?
3. May a dispatch service collect card payments on its own account (Stripe
   platform account) and pay drivers out? § 3 (10b) suggests yes. What does that
   mean for who issues the receipt?
4. What is the retention period for dispatch order records under the Sztv.?
5. Which city decrees apply in candidate cities for option B?
6. Does Hopin's per-ride fee to drivers trigger any price-regulation issue under
   the fixed-tariff regime?

## Sources

Primary law (read 2026-09-19):

- [Government Decree 176/2015 (VII. 7.) — Jogtár consolidated text](https://net.jogtar.hu/jogszabaly?docid=a1500176.kor)
- [Budapest Assembly Decree 31/2013 (IV. 18.) — Jogtár consolidated text](https://net.jogtar.hu/rendelet?council=fovaros&dbnum=104&docid=A1300031.FOV)
- [Budapest Assembly Decree 24/2025 (X. 6.) amending 31/2013](https://net.jogtar.hu/rendelet?council=fovaros&dbnum=104&docid=A2500024.FOV)
- [Act XLI of 2012 on passenger transport services — Jogtár](https://net.jogtar.hu/jogszabaly?docid=a1200041.tv)
- [Directive (EU) 2024/2831 on platform work — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024L2831)

Authorities:

- [BKK — information for taxi service providers](https://bkk.hu/utazasi-informaciok/kozuti-kozlekedes/taxi/szolgaltato-vagyok/)
- [NAV — how a taxi driver issues invoices and reports data](https://nav.gov.hu/ado/afa/Egy_taxis_hogyan_tud_20200624)
- [NAV — receipt data reporting](https://nav.gov.hu/ado/enyugta/nyugtaadat-szolgaltatas)
- [NAIH — DPIA mandatory list](https://www.naih.hu/hatasvizsgalati-lista)
- [European Commission — DAC7](https://taxation-customs.ec.europa.eu/taxation/tax-transparency-cooperation/administrative-co-operation-and-mutual-assistance/dac7_en)

Secondary (used for dates and context, not for legal conclusions):

- [Index — Budapest tariff increase from 2026-08-01](https://index.hu/belfold/2026/07/30/taxi-dragulas-tarifaemeles-dijemeles-budapest-metal-zoltan/)
- [Számlázz.hu — receipt data reporting from 2026-09-01](https://tudastar.szamlazz.hu/gyik/nyugtaadat-szolgaltatas-kotelezettseg)
- [Billingo — e-receipt introduction 2026](https://www.billingo.hu/tudastar/olvas/e-nyugta-bevezetese)
- [Bolt — how prices are calculated in Hungary](https://bolt.eu/en/support/articles/4414903263122/)
- [VGD — DAC7 obligations in Hungary](https://vgd.hu/en/news/professional-publications-newsletters/reporting-obligations-of-digital-platform-operators-dac7-in-hungary)
- [Remote Work Europe — Platform Work Directive transposition status](https://remoteworkeurope.eu/news/2026/platform-work-directive-enforcement-divergence-2026/)
