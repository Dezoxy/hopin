# Target State

The MVP described by this knowledge base: one city, a passenger app on iOS, Android and web, a driver app, an admin web and a backend in AWS eu-central-1, with recovery copies in Azure. See the **Context**, **Clients**, **Backend** and **ProductionCore** views.

Why this target:

- It is the smallest system that can run a legal taxi dispatch operation under [C-01](../requirements/constraints.md) to [C-09](../requirements/constraints.md).
- It meets [QA-01](../requirements/quality-attributes.md) to [QA-11](../requirements/quality-attributes.md) with managed services one person can operate ([P-01](../principles/architecture-principles.md)).

Open parts of the target:

- The market-entry model decides who the legal operator is ([RISK-001](../risks/architecture-risks.md)).
- BKK data feed, taxi-meter integration and invoicing provider are not modelled yet.

Beyond the MVP (not committed): more cities, scheduled rides, in-app chat, and possibly a warm standby in Azure (plan step S110).
