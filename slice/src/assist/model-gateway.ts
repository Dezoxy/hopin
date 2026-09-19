import { AnthropicBedrockMantle } from '@anthropic-ai/bedrock-sdk';
import type Anthropic from '@anthropic-ai/sdk';
import { renderCaseFile, type CaseFile } from './case-file';

/**
 * Two planes (ADR 15): the data plane may see real ride data and is Bedrock in
 * an EU region; the evaluation plane (OpenRouter) only ever sees synthetic
 * cases and lives outside src/, so the running API cannot import it.
 */
export type Plane = 'data' | 'eval';

export interface DraftRequest {
  readonly system: string;
  readonly caseFile: CaseFile;
}

export interface ModelClient {
  readonly plane: Plane;
  readonly name: string;
  /** Returns the raw input of the submit_draft tool call, unvalidated. */
  submitDraft(req: DraftRequest): Promise<unknown>;
}

export class AssistError extends Error {}

export function assertDataPlane(model: ModelClient): void {
  if (model.plane !== 'data') throw new AssistError(`evaluation-plane model ${model.name} may not see real data`);
}

export interface BedrockConfig {
  readonly region: string;
  readonly model: string;
}

/**
 * Regions in EU member states where AWS offers the bedrock-mantle endpoint.
 * The endpoint has no cross-region inference, so a request is processed in the
 * region it is sent to (ADR 15). A prefix check is not enough: eu-west-2 is
 * London and eu-central-2 is Zurich.
 */
export const EU_MANTLE_REGIONS: readonly string[] = ['eu-central-1', 'eu-west-1', 'eu-south-1', 'eu-north-1'];

export function bedrockConfigFor(cfg: BedrockConfig): BedrockConfig {
  if (!EU_MANTLE_REGIONS.includes(cfg.region)) {
    throw new AssistError(
      `Bedrock region must be an EU member-state region with the Messages endpoint (${EU_MANTLE_REGIONS.join(', ')}), got ${cfg.region}`,
    );
  }
  return cfg;
}

export const SUBMIT_DRAFT_TOOL: Anthropic.Tool = {
  name: 'submit_draft',
  description: 'Submit the summary and the draft reply for human review.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'What happened, for the dispatcher, based only on the case file.' },
      draftReply: { type: 'string', description: 'A reply to the passenger for a human to review and send.' },
      citedEventIds: { type: 'array', items: { type: 'integer' }, description: 'Ids of the events relied on.' },
    },
    required: ['summary', 'draftReply', 'citedEventIds'],
    additionalProperties: false,
  },
};

const MAX_TOKENS = 4000;

/** Claude on Amazon Bedrock through the Messages-API endpoint, EU region only. */
export class BedrockModelClient implements ModelClient {
  readonly plane = 'data' as const;
  readonly name: string;
  private readonly client: AnthropicBedrockMantle;
  private readonly model: string;

  constructor(cfg: BedrockConfig) {
    const checked = bedrockConfigFor(cfg);
    this.client = new AnthropicBedrockMantle({ awsRegion: checked.region });
    this.model = checked.model;
    this.name = `bedrock:${checked.model}@${checked.region}`;
  }

  async submitDraft(req: DraftRequest): Promise<unknown> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: MAX_TOKENS,
      system: req.system,
      tools: [SUBMIT_DRAFT_TOOL],
      tool_choice: { type: 'auto' },
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: renderCaseFile(req.caseFile) }],
    });
    if (message.stop_reason === 'refusal') throw new AssistError('the model declined; a human writes this reply');
    if (message.stop_reason === 'max_tokens') throw new AssistError('the draft was cut off');
    const call = message.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === SUBMIT_DRAFT_TOOL.name,
    );
    if (!call) throw new AssistError('the model did not submit a draft');
    return call.input;
  }
}
