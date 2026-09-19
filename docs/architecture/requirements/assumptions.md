# Assumptions

Things we believe but have not confirmed. Each has an owner and a re-check point. When one turns out false, review what it affects. The owner is the founder for all of them today; there is no team yet.

| ID | Assumption | Impact if wrong | Affects | Owner | Re-check by |
|---|---|---|---|---|---|
| A-01 | A licensed Budapest dispatch company will accept Hopin as its technology provider | Entry model falls back to another city or needs 100 M HUF equity | [RISK-001](../risks/architecture-risks.md), plan Part F question 7 | Founder | Plan step S111 |
| A-02 | A Hungarian lawyer confirms the S002 memo's reading of the taxi rules | Fare, fee and receipt design change | [C-01](constraints.md) to [C-08](constraints.md) | Founder | Plan step S111 |
| A-03 | Mapbox road ETAs are accurate enough in Budapest for matching and estimates | Poor matches and disputed estimates | [QA-01](quality-attributes.md), [C-04](constraints.md), [RISK-005](../risks/architecture-risks.md) | Founder | Plan step S029 |
| A-04 | Cognito SMS one-time codes arrive reliably and affordably in Hungary | Sign-in friction or high SMS cost | [ADR 6](../decisions/0006-cognito-phone-otp.md), [RISK-002](../risks/architecture-risks.md) | Founder | Plan step S026 |
| A-05 | Stripe Connect Express can onboard and pay out Hungarian taxi businesses | Payout design changes | [ADR 7](../decisions/0007-stripe-connect-payments.md) | Founder | Plan step S041 |
| A-06 | MVP peak stays below 200 online drivers and 50 ride requests per minute | Instance sizes and Redis single node insufficient | [QA-01](quality-attributes.md), [QA-03](quality-attributes.md) | Founder | Plan step S092 |
| A-07 | Expo background location passes App Store and Play review for the driver app | Launch delay | [RISK-003](../risks/architecture-risks.md) | Founder | Plan step S105 |
| A-08 | About 20 drivers will use Hopin alongside Bolt at a 15 % commission | Pilot has no supply | [RISK-011](../risks/architecture-risks.md), [business case](../../business/business-case.md) | Founder | Plan step S117 |
| A-09 | A licensed dispatch company will pay around 10,000 HUF per car per month for a certified platform with a passenger app | White-label revenue model fails | [RISK-001](../risks/architecture-risks.md), [business case](../../business/business-case.md) | Founder | Plan step S118 |
