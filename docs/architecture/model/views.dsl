// Each view answers one question for one audience. Budgets (from the
// architecture-views skill): overview 7 elements / 8 arrows, technical
// 10 / 12, runtime 7 participants / 8 interactions, deployment 12 boxes / 8 arrows.
// The view register in README.md records audience, omissions and verification.

systemContext hopin "Context" "Hopin (planned): who uses it and which outside services does it rely on?" {
    include passenger driver operator stripe mapbox expoPush
    autoLayout lr
}

// Sign-in arrows (every client -> Identity) crossed all API arrows in the
// automatic layout; Identity moved to the Backend view.
container hopin "Clients" "Hopin (planned): which apps exist, who uses each one, and how do they reach the API?" {
    include passenger driver operator partnerDispatcher tripViewer
    include hopin.passengerApp hopin.driverApp hopin.adminWeb hopin.tripSharePage
    include hopin.api
    autoLayout lr
}

container hopin "Backend" "Hopin (planned): what does the API depend on to do its work?" {
    include hopin.api hopin.identity hopin.db hopin.cache hopin.docStore hopin.secrets
    include stripe mapbox expoPush
    exclude "expoPush -> *"
    autoLayout lr
}

container hopin "OffProviderRecovery" "Hopin (planned): how do data and keys leave AWS so the service survives losing it?" {
    include hopin.backupExporter hopin.db hopin.docStore hopin.secrets hopin.offsiteBackup hopin.escrowVault operator
    autoLayout lr
}

// Entry paths and where authentication happens. Trust boundaries TB-1 to TB-3
// in security/trust-boundaries.md. Azure (TB-4) is the OffProviderRecovery view.
container hopin "Security" "Hopin (planned): what is internet-facing, where do users authenticate, and where are secrets?" {
    include hopin.passengerApp hopin.adminWeb hopin.tripSharePage
    include hopin.api hopin.identity hopin.secrets hopin.db stripe
    autoLayout lr
}

dynamic hopin "RideRequest" "Hopin (planned): what happens between a passenger requesting a ride and seeing a matched driver?" {
    hopin.passengerApp -> hopin.api "Requests a ride from a valid fare quote"
    hopin.api -> hopin.db "Stores the ride as REQUESTED"
    hopin.api -> hopin.cache "Finds the nearest online drivers and sends the first offer"
    hopin.driverApp -> hopin.api "Receives the offer on its open socket and accepts it"
    hopin.api -> stripe "Authorises the quoted fare on the passenger's card"
    hopin.api -> hopin.db "Stores the ride as MATCHED and appends a ride event"
    hopin.api -> hopin.cache "Publishes the match to the ride's socket room"
    hopin.passengerApp -> hopin.api "Receives the driver, ETA and live position on its open socket"
    autoLayout lr
}

deployment hopin production "ProductionCore" "Hopin (planned): where does the live service run in AWS, and what fails together?" {
    include production.aws.euc1.alb
    include production.aws.euc1.ecs.apiService.apiInstance
    include production.aws.euc1.rds.dbInstance
    include production.aws.euc1.redis.cacheInstance
    include production.aws.euc1.s3.docStoreInstance
    autoLayout lr
}

// AWS-side backups only. The off-provider chain (exporter, Azure) is the
// OffProviderRecovery view; drawing both here exceeded the deployment budget.
deployment hopin production "AwsBackups" "Hopin (planned): which AWS backups exist, and in which regions?" {
    include production.aws.euc1.rds.dbInstance
    include production.aws.euc1.s3.docStoreInstance
    include production.aws.euc1.backupVault
    include production.aws.euw1.backupCopy
    autoLayout lr
}

// Placement of the off-provider chain. The database and document store it
// reads are in ProductionCore; repeating them here exceeded the budget.
deployment hopin production "AzureRecovery" "Hopin (planned): where does the nightly off-provider copy run, and where do its copies land?" {
    include production.aws.euc1.ecs.exporterTask.exporterInstance
    include production.azure.blob.offsiteInstance
    include production.azure.kv.escrowInstance
    autoLayout lr
}

// ── Components: inside the Hopin API ────────────────────────────────────────

component hopin.api "ApiRideFlow" "Hopin API (planned): which components carry a ride from estimate to live tracking?" {
    include hopin.passengerApp hopin.driverApp
    include hopin.api.quotes hopin.api.rides hopin.api.matching hopin.api.realtime
    include hopin.db hopin.cache
    autoLayout lr
}

// Ride Lifecycle is left out: its outbox write is step 1 of PaymentCapture.
// Regulatory adapters are split into ApiRegulatoryFeeds to stay within budget.
component hopin.api "ApiPayments" "Hopin API (planned): which parts move money, and how do they avoid charging twice?" {
    include hopin.api.payments hopin.api.webhooks hopin.api.outbox
    include hopin.paymentWorkflow stripe hopin.db
    autoLayout lr
}

component hopin.api "ApiRegulatoryFeeds" "Hopin API (planned): how do committed changes reach BKK and the invoicing provider?" {
    include hopin.api.outbox hopin.api.compliance
    include hopin.db hopin.cache bkk invoicing
    // Left-to-right placed BKK on the system boundary; top-to-bottom does not.
    autoLayout tb
}

component hopin.api "PartnerConsole" "Hopin API (planned): how does a partner's dispatch console reach its data, and only its data?" {
    include hopin.adminWeb
    include hopin.api.dispatch hopin.api.tenancy hopin.api.rides hopin.api.realtime
    include hopin.identity hopin.db
    autoLayout lr
}

// OpenRouter appears only through the operator: the API has no route to it.
component hopin.api "AiAssist" "Hopin API (planned): where does AI help staff, and what keeps real data away from evaluation models?" {
    include partnerDispatcher operator hopin.adminWeb
    include hopin.api.assist hopin.api.tenancy hopin.db hopin.monitoring
    include bedrock openrouter
    exclude "operator -> hopin.offsiteBackup"
    autoLayout lr
}

// ── Runtime scenarios ───────────────────────────────────────────────────────

dynamic hopin.api "PartnerIsolation" "Hopin API (planned): how is a partner request kept inside that partner's data?" {
    hopin.adminWeb -> hopin.api.dispatch "Requests live rides with a token carrying the partner's tenant"
    hopin.api.dispatch -> hopin.api.tenancy "Opens a tenant-scoped transaction"
    hopin.api.tenancy -> hopin.identity "Validates the token and reads the tenant claim"
    hopin.api.tenancy -> hopin.db "Sets the tenant for this transaction"
    hopin.api.dispatch -> hopin.db "Queries rides; row-level security returns only this partner's rows"
    autoLayout lr
}

dynamic hopin.api "PaymentCapture" "Hopin API (planned): after the driver completes a ride, how is the meter amount captured exactly once?" {
    hopin.api.rides -> hopin.db "Stores COMPLETED, the meter amount, a ride event and a ride.completed outbox entry in one transaction"
    hopin.api.outbox -> hopin.db "Reads the committed ride.completed entry"
    hopin.api.outbox -> hopin.paymentWorkflow "Starts the capture workflow named by the ride ID; a second start is rejected"
    hopin.paymentWorkflow -> stripe "Captures the meter amount with the ride's idempotency key, then waits"
    stripe -> hopin.api.webhooks "Confirms the capture"
    hopin.api.webhooks -> hopin.paymentWorkflow "Resumes the workflow with its task token"
    hopin.api.webhooks -> hopin.db "Marks the payment captured and writes a payment.captured outbox entry"
    autoLayout lr
}

dynamic hopin.api "PaymentCaptureDeclined" "Hopin API (planned): what happens when the capture is declined?" {
    hopin.paymentWorkflow -> stripe "Tries to capture; the card is declined"
    hopin.paymentWorkflow -> stripe "Waits and retries twice more within 24 hours; still declined"
    hopin.paymentWorkflow -> hopin.api.payments "Reports the capture as failed"
    hopin.api.payments -> hopin.db "Marks the payment FAILED and writes a payment.failed outbox entry"
    hopin.api.outbox -> hopin.db "Reads the payment.failed entry"
    hopin.api.outbox -> expoPush "Asks the passenger to update the card; new rides blocked until paid"
    // Left-to-right placed Expo Push on the system boundary; top-to-bottom does not.
    autoLayout tb
}

dynamic hopin.api "DisputeAssist" "Hopin API (planned): how does a complaint become a draft reply that a human approves?" {
    partnerDispatcher -> hopin.adminWeb "Opens a ride and pastes the passenger's complaint"
    hopin.adminWeb -> hopin.api.assist "Asks for a draft reply for this ride"
    hopin.api.assist -> hopin.api.tenancy "Opens a transaction scoped to the staff member's partner"
    hopin.api.assist -> hopin.db "Reads the ride and its events; another partner's ride is not found"
    hopin.api.assist -> bedrock "Sends roles instead of IDs, no contact details, rounded positions; gets a draft back"
    hopin.api.assist -> hopin.monitoring "Logs the outcome and cited event IDs, never the text"
    hopin.adminWeb -> hopin.api.assist "Receives the checked draft; staff edit, send or discard it"
    // Left-to-right drew the logging arrow through the database; top-to-bottom does not.
    autoLayout tb
}

dynamic hopin "DriverAlarm" "Hopin (planned): what happens when a driver presses the alarm?" {
    hopin.driverApp -> hopin.api "Sends the alarm with live position"
    hopin.api -> hopin.db "Records the alarm as a ride event"
    hopin.adminWeb -> hopin.api "Receives the alarm on the partner dispatch console"
    partnerDispatcher -> hopin.adminWeb "Acknowledges and calls 112 with the position"
    hopin.api -> hopin.monitoring "Raises a page-worthy event"
    hopin.monitoring -> operator "Pages the platform operator"
    autoLayout lr
}

dynamic hopin "TripShare" "Hopin (planned): how does someone without an account follow a shared ride?" {
    hopin.passengerApp -> hopin.api "Creates a share link for the ride"
    hopin.api -> hopin.db "Stores a random token that expires 2 hours after the ride"
    tripViewer -> hopin.tripSharePage "Opens the link from a message"
    hopin.tripSharePage -> hopin.api "Polls the ride's position with the token"
    hopin.api -> hopin.cache "Reads the live driver position"
    autoLayout lr
}

dynamic hopin "PhoneOrder" "Hopin (planned): how does a phone order become a ride?" {
    partnerDispatcher -> hopin.adminWeb "Enters the caller's pickup and phone number"
    hopin.adminWeb -> hopin.api "Creates a ride for this partner"
    hopin.api -> hopin.db "Stores the order in the partner's order register"
    hopin.api -> hopin.cache "Finds nearby online taxis of this partner"
    hopin.driverApp -> hopin.api "Receives the offer and accepts it"
    hopin.adminWeb -> hopin.api "Sees the match and confirms it to the caller"
    autoLayout lr
}

dynamic hopin "RedisLost" "Hopin (planned): what happens when the Redis node is lost?" {
    hopin.api -> hopin.cache "Loses the connection; live positions and queued jobs are gone"
    hopin.api -> hopin.db "Keeps serving ride state from the database; matching pauses"
    hopin.driverApp -> hopin.api "Reconnects and re-reports position within seconds"
    hopin.api -> hopin.cache "Rebuilds the live index on the replacement node"
    hopin.api -> hopin.db "Re-derives pending timers and jobs from ride states"
    autoLayout lr
}

// ── Concern views ───────────────────────────────────────────────────────────

container hopin "LocationData" "Hopin (planned): where does personal location data go, and where does it leave the system?" {
    include hopin.driverApp hopin.passengerApp hopin.tripSharePage
    include hopin.api hopin.cache hopin.db bkk
    include hopin.backupExporter hopin.offsiteBackup
    autoLayout lr
}

container hopin "AlertPath" "Hopin (planned): how does a failure become a page to the operator?" {
    include hopin.api hopin.backupExporter hopin.monitoring
    include hopin.passengerApp hopin.driverApp sentry operator
    exclude "hopin.passengerApp -> hopin.api" "hopin.driverApp -> hopin.api"
    // Left-to-right placed Sentry on the system boundary; top-to-bottom does not.
    autoLayout tb
}

container hopin "Authorities" "Hopin (planned): which authorities and regulated devices touch the system, and how?" {
    include hopin.api hopin.driverApp taxiMeter bkk invoicing nav
    autoLayout lr
}

// ── Delivery and recovery placement ─────────────────────────────────────────

deployment hopin production "Delivery" "Hopin (planned): how does a change reach production, and with which identity?" {
    include production.github.actions
    include production.aws.euc1.ecr production.aws.euc1.tfState
    include production.aws.euc1.ecs.apiService.apiInstance
    autoLayout lr
}

deployment hopin regionRecovery "RegionRecovery" "Hopin (planned): what runs in eu-west-1 after eu-central-1 is lost?" {
    include *
    autoLayout lr
}

deployment hopin accountRecovery "AccountRecovery" "Hopin (planned): what runs on Azure after the AWS account is lost, and what is missing?" {
    include *
    autoLayout lr
}
