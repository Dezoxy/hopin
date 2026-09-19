# Scope

## In scope for the MVP

Passenger app, driver app, admin web, public trip-share page and the backend that serves them, in one city with prices in forints. The full list is in [plan Part A3](../../hopin-plan.md#a3-in-scope-for-mvp).

## Out of scope for the MVP

Scheduled and pooled rides, surge pricing, in-app chat and navigation, promo codes, cash, multiple cities, and a live second copy of production in Azure. The full list is in [plan Part A4](../../hopin-plan.md#a4-explicitly-out-of-scope-for-mvp-v2-backlog).

## Open questions that can change the architecture

- The market-entry model is open (plan Part F, question 7). Operating as Hopin's own Budapest dispatch needs 100 M HUF equity and BKK-certified software ([S002 memo](../../compliance/s002-regulatory-memo.md)). A partner model would move the legal operator role out of Hopin.
- Taxi-meter integration, the BKK real-time data feed and an invoicing provider are not modelled yet (plan steps S112, S113, S047).
- The Azure region is not chosen yet (plan step S012).
