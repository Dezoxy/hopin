// Hopin and its containers. Groups mark where each container runs and which
// trust boundary it sits behind. Load balancer, WAF and CDN are infrastructure,
// so they appear in deployment.dsl, not here.

hopin = softwareSystem "Hopin" "Ride-hailing for short city trips: booking, matching, live tracking, payment and ratings." {

    group "Client devices (untrusted)" {
        passengerApp = container "Passenger App" "Books rides, shows fare and live driver, pays, shares and rates trips." "React Native, Expo (iOS, Android, Web)" "Layer Clients,Mobile App"
        driverApp = container "Driver App" "Onboards drivers, streams location while online, accepts offers and runs the ride." "React Native, Expo (iOS, Android)" "Layer Clients,Mobile App"
        adminWeb = container "Admin Web" "Driver approval, live operations, ride lookup, refunds, fare and service-area settings." "Next.js static export" "Layer Clients,Web UI"
        tripSharePage = container "Trip-share Page" "Shows a shared ride's live position to anyone holding the link." "Static web page" "Layer Clients,Web UI"
    }

    group "AWS eu-central-1" {
        api = container "Hopin API" "Quotes, matching, ride lifecycle, realtime gateway, payments, Stripe webhooks and background jobs." "Node.js, NestJS, Socket.IO" "Layer Services,Internet-exposed"
        identity = container "Identity" "Phone-number sign-in with one-time codes; issues JWTs with passenger, driver or admin group." "Amazon Cognito user pool" "Layer Services"
        backupExporter = container "Backup Exporter" "Nightly: dumps the database, encrypts it and copies it with driver documents to Azure." "Scheduled container task, pg_dump" "Layer Services"
        db = container "Hopin Database" "System of record: users, drivers, rides, ride events, payments, ratings, fare configs, service areas." "PostgreSQL 16, PostGIS" "Layer Data,Database"
        cache = container "Realtime Cache" "Live driver positions (GEO index), socket pub/sub between API tasks, job queues." "Redis" "Layer Data,Database"
        docStore = container "Document Store" "Driver licence and vehicle documents, staged database dumps." "Amazon S3" "Layer Data,Storage"
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
tripViewer -> hopin.tripSharePage "Follows a shared ride on" "Web browser, shared link" "Person"
operator -> hopin.offsiteBackup "Restores the service from, after losing AWS" "Azure portal / CLI" "Person"

// Clients
hopin.passengerApp -> hopin.identity "Signs passengers in with" "SMS one-time code" "Layer Clients"
hopin.driverApp -> hopin.identity "Signs drivers in with" "SMS one-time code" "Layer Clients"
hopin.adminWeb -> hopin.identity "Signs the operator in with" "SMS one-time code + admin group" "Layer Clients"
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
