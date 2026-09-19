import { renderCaseFile } from '../src/assist/case-file';
import { SUBMIT_DRAFT_TOOL, type DraftRequest, type ModelClient } from '../src/assist/model-gateway';

/**
 * Evaluation plane only (ADR 15): OpenRouter reaches many models for
 * comparison. It lives outside src/, so the running API cannot import it, and
 * it declares plane 'eval', so assertDataPlane() rejects it for real data.
 * It speaks OpenRouter's own HTTP API; there is no Anthropic SDK path here.
 */
export class OpenRouterModelClient implements ModelClient {
  readonly plane = 'eval' as const;
  readonly name: string;

  constructor(
    private readonly model: string,
    private readonly apiKey: string,
  ) {
    this.name = `openrouter:${model}`;
  }

  async submitDraft(req: DraftRequest): Promise<unknown> {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: renderCaseFile(req.caseFile) },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: SUBMIT_DRAFT_TOOL.name,
              description: SUBMIT_DRAFT_TOOL.description,
              parameters: SUBMIT_DRAFT_TOOL.input_schema,
            },
          },
        ],
        // Even synthetic cases go only to providers that do not store or train on them.
        provider: { data_collection: 'deny' },
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as {
      choices?: Array<{ message?: { tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> } }>;
    };
    const call = body.choices?.[0]?.message?.tool_calls?.find((t) => t.function?.name === SUBMIT_DRAFT_TOOL.name);
    if (!call?.function?.arguments) return undefined; // scored as an invalid draft
    try {
      return JSON.parse(call.function.arguments) as unknown;
    } catch {
      return undefined;
    }
  }
}
