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

  it('accepts an EU member-state region that serves the Messages endpoint', () => {
    expect(bedrockConfigFor({ region: 'eu-west-1', model: 'anthropic.claude-opus-5' })).toEqual({
      region: 'eu-west-1',
      model: 'anthropic.claude-opus-5',
    });
  });

  // eu-west-2 is London and eu-central-2 is Zurich: "eu-" in the name, outside the EU.
  it.each(['us-east-1', 'eu-west-2', 'eu-central-2'])('rejects Bedrock region %s', (region) => {
    expect(() => bedrockConfigFor({ region, model: 'anthropic.claude-opus-5' })).toThrow(
      'Bedrock region must be an EU member-state region',
    );
  });
});
