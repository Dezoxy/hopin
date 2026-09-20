# Constraints

Constraints are rules the architecture must satisfy and cannot trade away. Each
one links to its evidence. Source research: [S002 regulatory
memo](../../compliance/s002-regulatory-memo.md), read 2026-09-19. **Not yet
confirmed by a lawyer**; the memo lists the open questions.

| ID | Constraint | Source | Affects |
|---|---|---|---|
| C-01 | Rides may only be done by licensed taxis with a certified taxi meter. Hopin operates as, or for, a licensed dispatch service. | Decree 176/2015 § 2, § 17 | Driver onboarding (S028, S064), market-entry model (plan Part F, question 7) |
| C-02 | In Budapest the payable fare is only the taxi-meter amount. Unit rates are fixed official prices: no discounts, surge or passenger fees. The app shows an estimate only. | Budapest decree 31/2013 § 15 (4)–(5), § 16 (1) | Quote service (S030), charging (S043), [ADR 7](../decisions/0007-stripe-connect-payments.md) |
| C-03 | Fare tables are official, change by decree (last change 2026-08-01), and differ by city and airport trips. | Budapest decree 31/2013 § 16 | Fare configs versioned by city and effective date (S004) |
| C-04 | Taxi selection must be automatic and use road distance and current traffic, not straight-line distance. | Budapest decree 31/2013 § 4 (6) c) | Matching (S031), [ADR 5](../decisions/0005-redis-socketio-realtime.md) |
| C-05 | Car devices report position at least every 5 seconds, accurate to 20 m, with heading. The taxi's position and meter start/stop go to BKK in real time. | Budapest decree 31/2013 § 3 (18), § 4 (6) b) | Driver app location (S065), new BKK data feed |
| C-06 | The dispatch software must accept driver attack/accident alarms with live location, record phone and online orders, and give passengers a fare-check app. BKK certifies it before use. | Budapest decree 31/2013 § 4 (6)–(8) | Driver app (S067), admin (S074), passenger app (S057) |
| C-07 | Every taxi accepts cards at no extra charge. Fares paid to the dispatch account must be traceable to the car's plate. | Budapest decree 31/2013 § 3 (10a)–(10b) | Payments (S043, S044) |
| C-08 | The passenger's receipt or invoice comes from the taxi operator, not Hopin. Receipt data is reported to NAV within 3 days from 2026-09-01. Hopin reports its own fee invoices to NAV and files DAC7 platform reports. | NAV guidance; DAC7 | Receipts and invoicing (S047), new DAC7 report |
| C-09 | A DPIA is required before processing starts, because of systematic location monitoring. | NAIH Article 35(4) list | GDPR work (S100), [plan C3](../../hopin-plan.md#c3-data-protection-and-gdpr) |
