# 14. AI assists staff with read-and-draft tasks only, never with decisions about rides, money or drivers

Date: 2026-09-19

## Status

Accepted

## Context

Four tasks in Hopin are mostly reading and writing text: answering passenger disputes, turning a phone caller's words into a ride order, summarising alarms for the operator, and reading the amount on a meter-receipt photo. A language model can do much of that work. The same model could also rank drivers, set prices or decide refunds, and those uses change who is accountable.

Three rules apply. Under the EU AI Act, systems that allocate work, monitor or evaluate workers are high-risk (Annex III, point 4). The Platform Work Directive requires human review of automated decisions about platform workers. Refunds are money, and ride facts are evidence in disputes ([QA-11](../requirements/quality-attributes.md)). Hopin has one founder and no compliance team to run a high-risk system.

## Decision drivers

- Stay out of the AI Act's high-risk category, because a solo founder cannot carry its conformity duties.
- A human stays accountable for every message, refund and driver consequence.
- Partner data stays inside its tenant, exactly as without AI ([ADR 9](0009-hybrid-multi-tenancy.md)).
- A wrong or manipulated model output must not reach a passenger unchecked.

## Considered options

1. No AI.
2. AI reads and drafts; a human approves every output; the model has no write tools.
3. AI acts on its own for low-value cases, for example refunds under a fixed amount.

## Decision

We will use option 2, for four use cases:

| Use case | The model reads | The model returns | A human then |
|---|---|---|---|
| Dispute assistant (prototyped in the slice) | One ride and its events, with roles instead of IDs, no contact details, coordinates rounded to about 1 km | A summary and a draft reply citing ride-event IDs | Edits, sends or discards the reply; decides any refund |
| Phone-order copilot (design only) | The dispatcher's typed notes of a call | A structured pickup, destination and time | Confirms the order before it is created |
| Operations triage (design only) | Alarm events and logs from one incident | A summary and likely cause | Decides and acts |
| Meter-receipt check (design only) | The receipt photo the driver uploads above the 15 % tolerance ([T-09](../security/threat-model.md#tb-2-edge-to-private-network)) | The amount it reads | Compares it with the typed amount; the partner decides any consequence |

The model gets no tools that write. Its single tool returns the draft to our code. Our code checks every draft before a human sees it: a draft that cites an unknown event, or that promises a refund or payment, is rejected. A refusal or a rejected draft means no draft: the human writes the reply from scratch.

AI is excluded from matching, pricing, driver scoring, account blocking and refunds.

## What this is not: an agent

Agent platforms split the work into a model that reasons, a harness that manages context, tools and delegation over long sessions, and an execution environment where the agent acts. A sound design can say what belongs to each and where the trust boundaries sit. Hopin's answers:

| Part | In Hopin |
|---|---|
| Model | Claude on Amazon Bedrock, replaceable behind the model gateway ([ADR 15](0015-bedrock-for-data-openrouter-for-evaluation.md)) |
| Harness | None. Each use case is one model call with one tool that returns the draft. There is no loop, no context to compact, no tool search and no subagent. |
| Execution environment | None. The model has no tool that acts, so there is nowhere for it to act. |
| Trust boundary | TB-7: the minimised case file going out, the checked draft coming back ([threat model](../security/threat-model.md#tb-7-hopin-to-model-providers)) |

This is deliberate. No task in Hopin needs the model to act, and a human in every loop is what keeps the AI Act classification. The three design-only use cases stay single calls too. Operations triage is the one that would tempt an agent with tools over logs and alarms; if that is ever wanted, it needs a new ADR that names the harness, the execution environment, a capability gateway with scoped identities, and the audit trail, before any tool is granted.

## Consequences

Positive:

- All four use cases are limited-risk or minimal-risk under the AI Act, provided counsel confirms ([AI Act classification](../../compliance/ai-act-classification.md)).
- Tenancy, audit and data minimisation work the same with or without AI; the model reads through the same row-level security as staff.
- The feature degrades to "staff write it themselves", which is how the service works without AI.

Negative / accepted trade-offs:

- No saving on refunds and no automated replies at night; a human is still in every loop.
- Staff may approve drafts without reading them ([RISK-021](../risks/architecture-risks.md)).
- The refund-promise check is a word pattern for English and Hungarian. A promise phrased another way passes it and relies on the human reviewer ([T-30](../security/threat-model.md#tb-7-hopin-to-model-providers)).
- Contact details are removed by pattern, so a disguised phone number or email can still reach the model ([T-31](../security/threat-model.md#tb-7-hopin-to-model-providers)).

## Risks

- Prompt injection in complaint text ([T-27](../security/threat-model.md#tb-7-hopin-to-model-providers)); mitigated by the output checks and the absence of write tools.
- Scope creep towards driver scoring; any use that touches a driver's work needs a new ADR and a new classification.

## Related

- Requirements: [QA-11](../requirements/quality-attributes.md), [QA-12](../requirements/quality-attributes.md), [QA-13](../requirements/quality-attributes.md).
- Other ADRs: [9. Hybrid multi-tenancy](0009-hybrid-multi-tenancy.md), [15. Model provider planes](0015-bedrock-for-data-openrouter-for-evaluation.md).
- Prototype: [slice/src/assist/](../../../slice/src/assist/).
