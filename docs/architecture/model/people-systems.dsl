// People and software systems outside Hopin.
// Hopin itself is defined in containers.dsl.

passenger = person "Passenger" "Books city rides, pays in the app and shares trips."
driver = person "Driver" "Licensed taxi driver who accepts and completes rides."
operator = person "Operator" "Runs Hopin: approves drivers, handles refunds, tunes fares. Today the solo founder." "Staff"
tripViewer = person "Trip-share Viewer" "Anyone a passenger sends a trip link to. No account."

stripe = softwareSystem "Stripe" "Tokenises cards, authorises and captures fares, pays drivers out through Connect." "External"
mapbox = softwareSystem "Mapbox" "Map tiles, address search and driving directions." "External"
expoPush = softwareSystem "Expo Push Service" "Relays push notifications to APNs and FCM." "External"
