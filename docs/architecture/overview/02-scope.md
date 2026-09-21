## Scope

### In scope for the MVP

Passenger app, driver app, admin web, public trip-share page and the backend
that serves them, in one city with prices in forints. The full list is in
[plan Part A3](https://github.com/Dezoxy/hopin/blob/main/docs/hopin-plan.md#a3-in-scope-for-mvp).

### Out of scope for the MVP

Scheduled and pooled rides, surge pricing, in-app chat and navigation, promo
codes, cash, multiple cities, and a live second copy of production in Azure.
The full list is in
[plan Part A4](https://github.com/Dezoxy/hopin/blob/main/docs/hopin-plan.md#a4-explicitly-out-of-scope-for-mvp-v2-backlog).

Surge pricing and discounts are not a product choice. Only the certified meter
amount at official rates may be charged, so there is nothing to discount
([C-02](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/constraints.md)).

### Open questions that can change the architecture

- Taxi-meter integration, the BKK real-time data feed and an invoicing provider
  are not modelled yet (plan steps S112, S113, S047). Until a meter vendor is
  chosen, the meter interface is unknown
  ([T-23](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/security/threat-model.md#tb-6-hopin-to-regulators-and-partners)).
- The Azure region is not chosen yet (plan step S012).
- The joint-controller model stays Proposed until a Hungarian lawyer confirms
  it
  ([ADR 11](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0011-joint-controllers-with-partners.md)).
