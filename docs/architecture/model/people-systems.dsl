// People and software systems outside Hopin.
// Hopin itself is defined in containers.dsl.

passenger = person "Passenger" "Books city rides, pays in the app and shares trips."
driver = person "Driver" "Licensed taxi driver who accepts and completes rides."
operator = person "Operator" "Runs the Hopin platform: onboards partners, approves drivers, handles refunds. Today the solo founder." "Staff"
partnerDispatcher = person "Partner Dispatcher" "Staff of a licensed dispatch partner: takes phone orders, watches live rides and driver alarms for that partner only." "Staff"
tripViewer = person "Trip-share Viewer" "Anyone a passenger sends a trip link to. No account."

stripe = softwareSystem "Stripe" "Tokenises cards, authorises and captures fares, pays drivers out through Connect." "External"
mapbox = softwareSystem "Mapbox" "Map tiles, address search and driving directions." "External"
expoPush = softwareSystem "Expo Push Service" "Relays push notifications to APNs and FCM." "External"

// Authorities and regulated devices. Interfaces marked "not yet known" are
// open plan steps (S047, S112, S113), not designed contracts.
bkk = softwareSystem "BKK" "Budapest transport organiser: certifies dispatch software and receives real-time taxi data." "External"
taxiMeter = softwareSystem "Certified Taxi Meter" "Computes the legal fare in the car and issues the receipt; interface to Hopin not yet known." "External"
invoicing = softwareSystem "Invoicing Provider" "Issues and reports Hopin's fee invoices to drivers; Számlázz.hu or Billingo, to be chosen." "External"
nav = softwareSystem "NAV" "Hungarian tax authority: receives invoice and receipt data." "External"
sentry = softwareSystem "Sentry" "Crash and performance reports from the apps and API, EU region." "External"
