# AI Act classification of Hopin's AI use cases

Working classification for [ADR
14](../architecture/decisions/0014-ai-assists-staff-read-and-draft-only.md),
2026-09-19. It is an architect's reading of Regulation (EU) 2024/1689 (the AI
Act), not legal advice. Counsel confirms it together with the DPIA (plan step
S100) before any use case goes live.

## Roles

Hopin is the **deployer** of each system and does not place a model on the
market. Anthropic is the provider of the general-purpose model, and AWS operates
the Bedrock service ([ADR
15](../architecture/decisions/0015-bedrock-for-data-openrouter-for-evaluation.md)).
Partners are deployers too when their staff use the console.

## Use cases

| Use case | Built | Who it affects | Classification | Why | Duties that apply |
|---|---|---|---|---|---|
| Dispute assistant | Prototype in the slice | Passengers; indirectly drivers named in a ride | Minimal risk | Drafts text for staff; a human edits, sends or discards every reply and decides any refund | AI literacy for staff (Article 4) |
| Phone-order copilot | Design only | Callers | Minimal risk | Turns the dispatcher's notes into a structured order that the dispatcher confirms; nobody talks to the model | AI literacy |
| Operations triage | Design only | The operator | Minimal risk | Summarises incident events for the operator; decides nothing | AI literacy |
| Meter-receipt check | Design only | Drivers | Minimal risk while the boundary holds; high-risk if it crosses it | It only reads the amount on a receipt photo for a human to compare. If its output fed a driver score or triggered a block, it would evaluate the behaviour of workers (Annex III, point 4) | AI literacy; the boundary below |

No use case interacts with passengers or callers directly, so the Article 50
duty to disclose a chatbot does not arise. A voicebot for phone orders would
change that, and it is out of scope.

## Boundaries that keep this classification

- **No AI in matching, pricing, driver scoring, account blocking or refunds.**
  These allocate or evaluate work, or decide about money ([ADR
  14](../architecture/decisions/0014-ai-assists-staff-read-and-draft-only.md)).
- **The meter-receipt check produces a number, not a verdict.** The partner sees
  the photo, the typed amount and the read amount, and decides. Its output is
  never stored against the driver as a score.
- **The Platform Work Directive applies anyway** to any automated monitoring of
  drivers. Hopin's AI does not monitor drivers, and this must stay true in the
  DPIA.

## GDPR notes for the DPIA

- Personal data in a case file: complaint text and ride events with rounded
  positions. No names, phone numbers, emails or IDs.
- Processor: AWS, under the existing agreement. Claude runs in eu-west-1 with no
  cross-region routing, and the model provider cannot see prompts ([ADR
  15](../architecture/decisions/0015-bedrock-for-data-openrouter-for-evaluation.md)).
  AWS may keep inputs for abuse detection in that region; human review by AWS is
  forbidden by policy ([RISK-020](../architecture/risks/architecture-risks.md)).
  No transfer to OpenRouter, which receives synthetic cases only.
- Lawful basis follows the complaint handling itself: contract with the
  passenger, and the joint-controller arrangement with the partner ([ADR
  11](../architecture/decisions/0011-joint-controllers-with-partners.md)).
- No automated decision with legal or similar effect (GDPR Article 22), because
  a human decides every outcome.

## Review trigger

Any new use case, any use that touches a driver's work, or any tool that lets
the model act instead of draft.
