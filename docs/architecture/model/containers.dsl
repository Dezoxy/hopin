// Hopin and its containers. Groups mark where each container runs and which
// trust boundary it sits behind. Load balancer, WAF and CDN are infrastructure,
// so they appear in deployment.dsl, not here.

hopin = softwareSystem "Hopin" "Ride-hailing for short city trips: booking, matching, live tracking, payment and ratings." {

    group "Client devices (untrusted)" {
        passengerApp = container "Passenger App" "Books rides, shows the fare estimate and live driver, pays, shares and rates trips." "React Native, Expo (iOS, Android, Web)" "Layer Clients,Mobile App"
        driverApp = container "Driver App" "Onboards drivers, streams location while online, accepts offers and runs the ride." "React Native, Expo (iOS, Android)" "Layer Clients,Mobile App"
        adminWeb = container "Admin Web" "Platform administration for the operator; a partner-scoped dispatch console for partner staff (phone orders, live map, alarms)." "Next.js static export" "Layer Clients,Web UI"
        tripSharePage = container "Trip-share Page" "Shows a shared ride's live position to anyone holding the link." "Static web page" "Layer Clients,Web UI"
    }

    group "AWS eu-central-1" {
        api = container "Hopin API" "Quotes, matching, ride lifecycle, realtime gateway, payments, Stripe webhooks and background jobs." "Node.js, NestJS, Socket.IO" "Layer Services,Internet-exposed" {
            tenancy = component "Tenancy" "Validates the access token, resolves the tenant and opens tenant-scoped transactions for row-level security." "NestJS guard and interceptor" "Layer Services"
            quotes = component "Quotes and Fares" "Checks the service area and estimates the fare from the official tariff." "NestJS module, PostGIS" "Layer Services"
            matching = component "Matching" "Pre-filters online taxis by distance, ranks them by road ETA and sends offers with timeouts." "NestJS module, Redis GEO, Mapbox Matrix" "Layer Services"
            rides = component "Ride Lifecycle" "Enforces the ride state machine; writes ride state, ride events and outbox entries in one transaction." "NestJS module" "Layer Services"
            realtime = component "Realtime Gateway" "Socket.IO namespaces for passengers, drivers and dispatch consoles." "Socket.IO, Redis adapter" "Layer Services"
            dispatch = component "Dispatch and Admin" "Partner dispatch console backend (phone orders, alarms) and platform administration." "NestJS module" "Layer Services"
            payments = component "Payments" "Authorises 1.3 times the estimate at match, refunds, and records the capture outcome reported by the payment workflow." "NestJS module" "Layer Services"
            webhooks = component "Stripe Webhooks" "Verifies signatures and applies payment events idempotently." "NestJS controller" "Layer Services"
            outbox = component "Outbox Relay" "Reads committed outbox entries; starts payment workflows and queues other jobs, at least once." "NestJS worker, BullMQ producer" "Layer Services"
            compliance = component "Regulatory Adapters" "Real-time feed to BKK, fee invoices to the invoicing provider. Interfaces not yet known." "NestJS module" "Layer Services"
        }
        identity = container "Identity" "Phone-number sign-in with one-time codes; issues JWTs with passenger, driver, admin or partner group and a tenant claim." "Amazon Cognito user pool" "Layer Services"
        backupExporter = container "Backup Exporter" "Nightly: dumps the database, encrypts it and copies it with driver documents to Azure." "Scheduled container task, pg_dump" "Layer Services"
        db = container "Hopin Database" "System of record: users, drivers, rides, ride events, payments, ratings, fare configs, service areas." "PostgreSQL 16, PostGIS" "Layer Data,Database"
        cache = container "Realtime Cache" "Live driver positions (GEO index), socket pub/sub between API tasks, job queues." "Redis" "Layer Data,Database"
        docStore = container "Document Store" "Driver licence and vehicle documents, staged database dumps." "Amazon S3" "Layer Data,Storage"
        paymentWorkflow = container "Payment Workflow" "Runs one capture workflow per ride: capture, wait for Stripe's confirmation, retry, charge any difference, report the outcome." "AWS Step Functions (Standard)" "Layer Services"
        monitoring = container "Monitoring" "Logs, metrics, traces and alarms; pages the operator." "Amazon CloudWatch, AWS X-Ray, SNS" "Layer Services"
        secrets = container "Secrets Store" "Database credentials, Stripe and Mapbox keys, Azure service credential." "AWS Secrets Manager" "Layer Data,Vault"
    }

    group "Azure (off-provider recovery)" {
        offsiteBackup = container "Off-provider Backup" "Immutable copies of encrypted database dumps and driver documents." "Azure Blob Storage, WORM policy" "Layer Recovery,Storage"
        escrowVault = container "Escrow Vault" "Dump encryption key and escrowed break-glass credentials." "Azure Key Vault" "Layer Recovery,Vault"
    }
}

// People use the clients
passenger -> hopin.passengerApp "Books, tracks, pays for and rates rides with" "Phone or web browser" "Person"
driver -> hopin.driverApp "Goes online, accepts and completes rides with" "Phone" "Person"
operator -> hopin.adminWeb "Approves drivers and runs operations with" "Web browser" "Person"
partnerDispatcher -> hopin.adminWeb "Takes phone orders and handles alarms for one partner with" "Web browser" "Person"
tripViewer -> hopin.tripSharePage "Follows a shared ride on" "Web browser, shared link" "Person"
operator -> hopin.offsiteBackup "Restores the service from, after losing AWS" "Azure portal / CLI" "Person"

// Clients
hopin.passengerApp -> hopin.identity "Signs passengers in with" "SMS one-time code" "Layer Clients"
hopin.driverApp -> hopin.identity "Signs drivers in with" "SMS one-time code" "Layer Clients"
hopin.adminWeb -> hopin.identity "Signs the operator and partner staff in with" "SMS one-time code + admin or partner group" "Layer Clients"
hopin.passengerApp -> hopin.api "Requests quotes and rides, receives ride state and driver position from" "HTTPS/JSON + Socket.IO over WSS" "Layer Clients"
hopin.driverApp -> hopin.api "Streams location and ride actions to, receives ride offers from" "HTTPS/JSON + Socket.IO over WSS" "Layer Clients"
hopin.adminWeb -> hopin.api "Reads operations data and sends admin actions to" "HTTPS/JSON + Socket.IO over WSS" "Layer Clients"
hopin.tripSharePage -> hopin.api "Polls a shared ride's position from" "HTTPS/JSON, share token, no login" "Layer Clients"
hopin.passengerApp -> mapbox "Renders map tiles from" "HTTPS, public restricted token" "Layer Clients"
hopin.passengerApp -> stripe "Sends card details directly to" "Stripe SDK, HTTPS" "Layer Clients"

// API
hopin.api -> hopin.identity "Validates access tokens against" "OIDC/JWKS" "Layer Services"
hopin.api -> hopin.db "Reads and writes rides, payments and profiles in" "PostgreSQL wire protocol, TLS" "Layer Services"
hopin.api -> hopin.cache "Indexes driver positions, fans out socket events and queues jobs in" "Redis protocol, TLS" "Layer Services"
hopin.api -> hopin.docStore "Issues upload and view links for driver documents in" "S3 presigned URLs" "Layer Services"
hopin.api -> hopin.secrets "Reads credentials and API keys at start-up from" "AWS SDK, task IAM role" "Layer Services"
hopin.api -> stripe "Authorises, captures and refunds fares, and pays drivers out via" "HTTPS/JSON" "Layer Services"
hopin.api -> mapbox "Geocodes addresses and requests routes from" "HTTPS/JSON, server token" "Layer Services"
hopin.api -> expoPush "Sends ride notifications through" "HTTPS/JSON" "Layer Services"
stripe -> hopin.api "Sends signed payment and payout webhooks to" "HTTPS/JSON, signed" "Inbound across trust boundary"
expoPush -> hopin.passengerApp "Delivers ride notifications to" "APNs / FCM"
expoPush -> hopin.driverApp "Delivers ride offers and notifications to" "APNs / FCM"

// Backup Exporter
hopin.backupExporter -> hopin.db "Dumps the database from" "pg_dump over TLS" "Layer Services"
hopin.backupExporter -> hopin.docStore "Stages encrypted dumps in and reads driver documents from" "AWS SDK, task IAM role" "Layer Services"
hopin.backupExporter -> hopin.secrets "Reads the Azure service credential from" "AWS SDK, task IAM role" "Layer Services"
hopin.backupExporter -> hopin.escrowVault "Fetches the dump encryption key from" "HTTPS" "Layer Services"
hopin.backupExporter -> hopin.offsiteBackup "Uploads encrypted dumps and document copies to" "HTTPS, write-only credential" "Layer Services"

// ── Components of the Hopin API ─────────────────────────────────────────────
// Clients
hopin.passengerApp -> hopin.api.quotes "Requests fare estimates from" "HTTPS/JSON" "Layer Clients"
hopin.passengerApp -> hopin.api.rides "Requests and cancels rides through" "HTTPS/JSON" "Layer Clients"
hopin.passengerApp -> hopin.api.realtime "Receives ride state and driver position from" "Socket.IO over WSS" "Layer Clients"
hopin.driverApp -> hopin.api.realtime "Streams location, receives offers and sends alarms through" "Socket.IO over WSS" "Layer Clients"
hopin.driverApp -> hopin.api.rides "Reports arrival, start and completion with the meter amount to" "HTTPS/JSON" "Layer Clients"
hopin.adminWeb -> hopin.api.dispatch "Takes phone orders and administers the platform through" "HTTPS/JSON" "Layer Clients"
hopin.adminWeb -> hopin.api.realtime "Receives live rides and alarms from" "Socket.IO over WSS" "Layer Clients"
hopin.tripSharePage -> hopin.api.rides "Polls a shared ride's position from" "HTTPS/JSON, share token" "Layer Clients"
stripe -> hopin.api.webhooks "Sends signed payment events to" "HTTPS/JSON, signed" "Inbound across trust boundary"

// Inside the API
hopin.api.tenancy -> hopin.identity "Validates access tokens against" "OIDC/JWKS" "Layer Services"
hopin.api.tenancy -> hopin.db "Sets the tenant for each transaction in" "SQL session setting" "Layer Services"
hopin.api.quotes -> hopin.db "Reads tariffs and service areas from" "SQL, PostGIS" "Layer Services"
hopin.api.quotes -> mapbox "Requests routes and distances from" "HTTPS/JSON" "Layer Services"
hopin.api.matching -> hopin.cache "Finds nearby online taxis in" "Redis GEO" "Layer Services"
hopin.api.matching -> mapbox "Ranks candidates by road ETA with" "Matrix API" "Layer Services"
hopin.api.matching -> hopin.api.realtime "Sends ride offers through" "In-process" "Layer Services"
hopin.api.rides -> hopin.api.matching "Asks for a driver for each new ride from" "In-process" "Layer Services"
hopin.api.rides -> hopin.api.payments "Asks to authorise the estimate through" "In-process" "Layer Services"
hopin.api.rides -> hopin.db "Writes ride state, ride events and outbox entries in one transaction to" "SQL" "Layer Services"
hopin.api.realtime -> hopin.cache "Fans out events across API tasks through" "Redis pub/sub" "Layer Services"
hopin.api.realtime -> hopin.api.matching "Passes driver positions and offer answers to" "In-process" "Layer Services"
hopin.api.dispatch -> hopin.api.tenancy "Opens tenant-scoped transactions through" "In-process" "Layer Services"
hopin.api.dispatch -> hopin.api.rides "Creates phone-order rides through" "In-process" "Layer Services"
hopin.api.dispatch -> hopin.db "Reads tenant-scoped operations data from" "SQL, row-level security" "Layer Services"
hopin.api.payments -> stripe "Authorises and refunds through" "HTTPS/JSON, idempotency keys" "Layer Services"
hopin.paymentWorkflow -> stripe "Captures the meter amount and charges any difference through" "Step Functions HTTP task, idempotency keys" "Layer Services"
hopin.paymentWorkflow -> hopin.api.payments "Reports the final capture outcome to" "HTTPS, IAM-signed" "Layer Services"
hopin.api.outbox -> hopin.paymentWorkflow "Starts one capture workflow per ride, named by ride ID" "Step Functions StartExecution" "Layer Services"
hopin.api.webhooks -> hopin.paymentWorkflow "Resumes the waiting workflow with its task token" "SendTaskSuccess" "Layer Services"
hopin.api.payments -> hopin.db "Records payment state and outbox entries in" "SQL" "Layer Services"
hopin.api.webhooks -> hopin.db "Applies confirmed payment events and outbox entries to" "SQL" "Layer Services"
hopin.api.outbox -> hopin.db "Reads committed outbox entries from" "SQL" "Layer Services"
hopin.api.outbox -> hopin.cache "Queues notification and feed jobs in" "BullMQ" "Layer Services"
hopin.api.outbox -> expoPush "Sends notifications through" "HTTPS/JSON" "Layer Services"
hopin.api.compliance -> hopin.cache "Takes feed and invoice jobs from" "BullMQ" "Layer Services"
hopin.api.compliance -> bkk "Streams taxi position and meter start/stop to" "Not yet known (S112)" "Layer Services"
hopin.api.compliance -> invoicing "Issues Hopin fee invoices through" "Provider API (S047)" "Layer Services"

// ── Authorities, meter and monitoring ───────────────────────────────────────
taxiMeter -> hopin.driverApp "Provides the final meter amount to" "Not yet known (S113)"
taxiMeter -> nav "Reports receipt data to" "Online cash register"
invoicing -> nav "Reports invoices to" "NAV Online Számla"
hopin.api -> hopin.monitoring "Sends logs, metrics, traces and alarm events to" "CloudWatch agent, OpenTelemetry" "Layer Services"
hopin.backupExporter -> hopin.monitoring "Reports nightly job results to" "CloudWatch" "Layer Services"
hopin.passengerApp -> sentry "Reports crashes to" "Sentry SDK" "Layer Clients"
hopin.driverApp -> sentry "Reports crashes to" "Sentry SDK" "Layer Clients"
hopin.monitoring -> operator "Pages the operator" "SNS: SMS and email" "Layer Services"
sentry -> operator "Alerts the operator about crash spikes" "Email"
