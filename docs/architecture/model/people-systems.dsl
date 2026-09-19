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
