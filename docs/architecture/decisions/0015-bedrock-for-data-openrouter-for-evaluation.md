# 15. Real data goes only to Amazon Bedrock in the EU; OpenRouter is for synthetic evaluation only

Date: 2026-09-19

## Status

Proposed

Accepted once EU-only processing on the Bedrock endpoint is confirmed ([RISK-020](../risks/architecture-risks.md)).

## Context

The AI use cases in [ADR 14](0014-ai-assists-staff-read-and-draft-only.md) send ride facts and complaint text to a model. That is personal data, and all personal data must stay in the EU with EU-contracted processors ([QA-05](../requirements/quality-attributes.md)). Hopin already runs on AWS in eu-central-1 ([ADR 1](0001-aws-primary-azure-for-off-provider-recovery.md)).

Choosing a model needs comparison: the same cases through several models, scored the same way. A router such as OpenRouter reaches many models behind one API key. It is a US service that forwards requests to whichever provider serves the model.

## Decision drivers

- Personal data stays in the EU under an existing processor agreement.
- Model comparison should be cheap and fast, without a contract per vendor.
- The application code must make it impossible, not merely forbidden, to send real data to the evaluation route.

## Considered options

1. Amazon Bedrock for everything.
2. OpenRouter for everything.
3. Two planes: Bedrock in an EU region for real data; OpenRouter only for synthetic evaluation cases.

## Decision

We will use option 3.

- **Data plane.** The API calls Claude on Amazon Bedrock through the Anthropic SDK's Bedrock client, in eu-central-1, with the task's IAM role. No API key exists to leak. AWS's processor terms already cover Hopin.
- **Evaluation plane.** An evaluation harness sends synthetic cases to candidate models through OpenRouter, asking for providers that do not store data. It scores each model with the same checks the application enforces.
- **The boundary is in code.** Every model client declares its plane. The API refuses to send a case file to any client that is not on the data plane, and it refuses a Bedrock region outside the EU. The OpenRouter client lives outside the application's source folder, so the application cannot import it.

A model chosen on the evaluation plane is then run on the data plane with the same cases before it goes live.

## Consequences

Positive:

- No new processor and no transfer outside the EU for personal data.
- Candidate models can be compared in an afternoon, for the cost of a few dozen requests.
- The plane check is tested; a mistake fails in CI, not in production.

Negative / accepted trade-offs:

- Only models offered on Bedrock can run in production.
- Evaluation results on OpenRouter may differ slightly from the same model on Bedrock; the final check on the data plane covers that.
- Bedrock's Claude endpoint does not support structured outputs; drafts come back through a tool call and are validated in code.

## Risks

- The EU-only guarantee depends on how Bedrock routes the model; it must be confirmed before real data flows ([RISK-020](../risks/architecture-risks.md)).
- A developer pastes a real complaint into an evaluation case ([T-29](../security/threat-model.md#tb-7-hopin-to-model-providers)); mitigated by review of the cases file, which lives in a public repository.

## Related

- Requirements: [QA-05](../requirements/quality-attributes.md), [QA-13](../requirements/quality-attributes.md).
- Other ADRs: [1. AWS primary](0001-aws-primary-azure-for-off-provider-recovery.md), [14. AI read-and-draft only](0014-ai-assists-staff-read-and-draft-only.md).
- Code: [model-gateway.ts](../../../slice/src/assist/model-gateway.ts), [eval/](../../../slice/eval/).
