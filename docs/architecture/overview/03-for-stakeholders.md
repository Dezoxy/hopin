## For stakeholders

A reading path for someone deciding whether this should be built. What it is,
what it does for the people who use it, who regulates it, and what could go
wrong. No hostnames, tables or protocols. Five stops.

### What it is and who uses it

Passengers, drivers and the operator each use their own client. The Hopin API
does the work and relies on three outside services: Stripe for payments and
driver payouts, Mapbox for maps and routes, and Expo Push for notifications.

![Context view: who uses Hopin and which outside services it relies on](embed:Context)

### One thing it does, end to end

A passenger asks for a ride and a driver is matched to it. Eight steps, all
automatic after the request.

![Ride request view: the eight steps from a ride request to a matched driver](embed:RideRequest)

### Who regulates it

The business exists because of the law and is shaped by it. Since 1 July 2026
every Budapest dispatch company must offer passengers a certified app with a
fare check. Most small companies cannot build one, and Hopin is designed to
that specification. The same law is why Hopin does not hold the licence itself:
that would need 100 M HUF of equity, BKK-certified software and staffed
dispatch around the clock.

![Authorities view: which authorities and regulated devices touch the system](embed:Authorities)

- [Regulatory memo](https://github.com/Dezoxy/hopin/blob/main/docs/compliance/s002-regulatory-memo.md): the statutes behind these constraints, and what is still unconfirmed

### When something goes wrong for a driver

A driver in trouble presses the alarm. Six steps take it to the partner's
dispatcher and to the operator.

![Driver alarm view: the six steps from a driver alarm to dispatcher and operator](embed:DriverAlarm)

### What could go wrong for the business

Three risks dominate, and only one is technical. The plan needs twenty partners
and none has signed. The legal reading is one person's reading, not legal
advice. And no restore has ever been rehearsed, so the recovery promises are
designs rather than evidence.

- [Executive summary](https://github.com/Dezoxy/hopin/blob/main/docs/executive-summary.md): the decision, the three-year numbers and the three gates
- [Architecture risks](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/risks/architecture-risks.md)
- [Transition plan](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/roadmap/transition-plan.md)
