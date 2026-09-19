import { assertDataPlane, bedrockConfigFor, type ModelClient } from './model-gateway';

const fake = (plane: 'data' | 'eval'): ModelClient => ({
  plane,
  name: `fake-${plane}`,
  submitDraft: async () => ({}),
});

describe('model gateway', () => {
  it('allows a data-plane model for real data', () => {
    expect(() => assertDataPlane(fake('data'))).not.toThrow();
  });

  it('refuses an evaluation-plane model (OpenRouter) for real data', () => {
    expect(() => assertDataPlane(fake('eval'))).toThrow('evaluation-plane model fake-eval may not see real data');
  });

  it('accepts an EU Bedrock region', () => {
    expect(bedrockConfigFor({ region: 'eu-central-1', model: 'anthropic.claude-opus-5' })).toEqual({
      region: 'eu-central-1',
      model: 'anthropic.claude-opus-5',
    });
  });

  it('rejects a Bedrock region outside the EU', () => {
    expect(() => bedrockConfigFor({ region: 'us-east-1', model: 'anthropic.claude-opus-5' })).toThrow(
      'Bedrock region must be in the EU',
    );
  });
});
