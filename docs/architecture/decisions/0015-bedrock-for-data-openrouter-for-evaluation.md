# 15. Real data goes only to Amazon Bedrock in the EU; OpenRouter is for synthetic evaluation only

Date: 2026-09-19

## Status

Accepted

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

- **Data plane.** The API calls Claude on Amazon Bedrock's Messages endpoint (`bedrock-mantle`) in eu-west-1, Ireland, with the task's IAM role. No API key exists to leak. AWS's processor terms already cover Hopin. The API itself stays in eu-central-1; only the model call crosses to Ireland, inside the EU.
- **Retention.** The Bedrock account's data-retention mode in eu-west-1 is set to `none` if the model allows it, otherwise `default`. A service control policy forbids `aws_review`, so no human at AWS reads complaints. Models that require human review, such as Claude Fable 5.1, are therefore not used on the data plane.
- **Evaluation plane.** An evaluation harness sends synthetic cases to candidate models through OpenRouter, asking for providers that do not store data. It scores each model with the same checks the application enforces.
- **The boundary is in code.** Every model client declares its plane. The API refuses to send a case file to any client that is not on the data plane, and it refuses a Bedrock region outside the EU. The OpenRouter client lives outside the application's source folder, so the application cannot import it.

A model chosen on the evaluation plane is then run on the data plane with the same cases before it goes live.

## Residency evidence

Checked against AWS and Anthropic documentation on 2026-09-19:

- **The Messages endpoint has no cross-region inference.** AWS's endpoint comparison marks geographic and global profiles as unsupported on `bedrock-mantle`, so a request is processed in the region it is sent to.
- **Claude Opus 5 runs in-region on that endpoint in eu-west-1 and eu-north-1.** It is not available there in eu-central-1, so Frankfurt, the region of the rest of Hopin, cannot be used for this call.
- **Model providers cannot see prompts.** Bedrock runs each provider's model in an AWS-owned deployment account that the provider cannot access.
- **Retained data stays in the region.** Under `default` mode AWS may keep inputs for abuse detection, in the region that processed them, and never passes them to the provider.

The code accepts only EU member-state regions that offer this endpoint. A prefix check would have let London (eu-west-2) and Zurich (eu-central-2) through.

Anthropic's region table lists Frankfurt with "Global, EU" endpoint types, which reads differently from AWS's per-model table. The AWS model card governs; the call fails rather than leaves the EU if it is wrong.

## Consequences

Positive:

- No new processor and no transfer outside the EU for personal data.
- Candidate models can be compared in an afternoon, for the cost of a few dozen requests.
- The plane check is tested; a mistake fails in CI, not in production.

Negative / accepted trade-offs:

- Only models offered on Bedrock can run in production.
- Evaluation results on OpenRouter may differ slightly from the same model on Bedrock; the final check on the data plane covers that.
- Bedrock's Claude endpoint does not support structured outputs; drafts come back through a tool call and are validated in code.
- The model call crosses from Frankfurt to Ireland, adding some network latency to a staff-facing draft that already takes seconds.

## Risks

- Documentation is not a contract, and AWS can change which regions serve a model or what they retain ([RISK-020](../risks/architecture-risks.md)). Re-check the model card and the account's retention mode before go-live and when the model changes.
- A developer pastes a real complaint into an evaluation case ([T-29](../security/threat-model.md#tb-7-hopin-to-model-providers)); mitigated by review of the cases file, which lives in a public repository.

## Related

- Requirements: [QA-05](../requirements/quality-attributes.md), [QA-13](../requirements/quality-attributes.md).
- Other ADRs: [1. AWS primary](0001-aws-primary-azure-for-off-provider-recovery.md), [14. AI read-and-draft only](0014-ai-assists-staff-read-and-draft-only.md).
- Code: [model-gateway.ts](../../../slice/src/assist/model-gateway.ts), [eval/](../../../slice/eval/).
