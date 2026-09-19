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
    include passenger driver operator tripViewer
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
