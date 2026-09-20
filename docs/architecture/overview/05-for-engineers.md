## For engineers

A reading path for someone who would build this. Which apps exist, what the API
depends on, which components carry each flow, and how a change reaches
production. Seven stops.

### The apps and what they talk to

Five kinds of user, four clients, one API.

![Clients view: the four client apps and how each reaches the API](embed:Clients)

![Backend view: what the Hopin API depends on to do its work](embed:Backend)

- [ADR 2: Expo for mobile, Next static export for admin](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0002-expo-for-mobile-apps-and-next-static-admin.md)
- [ADR 3: NestJS, PostgreSQL, PostGIS](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0003-nestjs-postgresql-postgis.md)

### A ride, from estimate to live tracking

Four API components carry the ride flow. The dynamic view below the components
shows the happy path end to end.

![API ride flow view: the components carrying a ride from estimate to live tracking](embed:ApiRideFlow)

![Ride request view: the eight steps from a ride request to a matched driver](embed:RideRequest)

Two rules are not obvious from the diagrams and cost real debugging time. A
client must re-read ride state over REST after subscribing, because events can
arrive before the subscription exists. And the realtime guarantee is at least
once to the Redis adapter, at most once to the client — Socket.IO cannot
promise more.

- [Event catalog](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/integration/event-catalog.md)
- [ADR 5: Redis and Socket.IO for realtime](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0005-redis-socketio-realtime.md)
- [QA-01](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/quality-attributes.md), [QA-02](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/quality-attributes.md): match latency and location freshness

### Money

The card is authorised for 1.3 times the estimate and captured at the meter
amount. One Step Functions workflow per ride, named after the ride, runs the
capture; Stripe idempotency keys are what actually prevent a double charge, and
a nightly reconciliation catches the rest.

![API payments view: the parts that move money and how they avoid charging twice](embed:ApiPayments)

![Payment capture view: how the meter amount is captured exactly once](embed:PaymentCapture)

![Declined capture view: the six steps to a failed payment and a blocked account](embed:PaymentCaptureDeclined)

- [ADR 12: payment capture workflow](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0012-payment-capture-workflow.md)
- [ADR 7: Stripe Connect](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0007-stripe-connect-payments.md)

### Regulators and the partner console

Committed changes reach BKK and the invoicing provider through the same
transactional outbox that carries everything else. The partner console reaches
only its own tenant's data.

![API regulatory feeds view: how committed changes reach BKK and the invoicing provider](embed:ApiRegulatoryFeeds)

![Partner console view: how a partner's console reaches its own data and only its own](embed:PartnerConsole)

- [Integration architecture](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/integration/integration-architecture.md)

### The paths without a login, and the one without an app

A shared trip is readable by anyone holding a revocable token — the token is
the only access control on that path. A phone order is taken by a partner's
dispatcher and becomes an ordinary ride.

![Trip share view: how someone without an account follows a shared ride](embed:TripShare)

![Phone order view: how a phone order becomes a ride](embed:PhoneOrder)

### Drafting a reply to a complaint

Seven steps from a complaint to a draft that a human approves. The draft checks
run in code rather than only in the prompt: a draft that cites an unknown ride
event or promises money is rejected before staff see it.

![Dispute assist view: how a complaint becomes a draft reply that a human approves](embed:DisputeAssist)

- [QA-13](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/requirements/quality-attributes.md): draft safety, and how it is tested
- [Slice README](https://github.com/Dezoxy/hopin/blob/main/slice/README.md): the running implementation of this flow

### How a change reaches production

![Delivery view: how a change reaches production, and with which identity](embed:Delivery)

- [ADR 8: Terraform for both clouds](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/decisions/0008-terraform-for-both-clouds.md)
- [Engineering standards](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/principles/engineering-standards.md)
- [Environments](https://github.com/Dezoxy/hopin/blob/main/docs/architecture/deployment/environments.md)
