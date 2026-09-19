/**
 * Evaluation harness for the dispute assistant (evaluation plane, synthetic cases only).
 *   OPENROUTER_API_KEY=... EVAL_MODELS=anthropic/claude-opus-5,anthropic/claude-sonnet-5 pnpm eval
 *   pnpm eval --fake        # offline check of the harness itself, no API key, no cost
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SYSTEM_PROMPT } from '../src/assist/case-file';
import type { DraftRequest, ModelClient } from '../src/assist/model-gateway';
import { OpenRouterModelClient } from './openrouter.client';
import { scoreCase, type CaseScore, type EvalCase } from './score';

const cases = JSON.parse(readFileSync(join(__dirname, 'cases.json'), 'utf8')) as EvalCase[];

/** Deterministic stand-in that answers well except on the injection case, to prove the harness catches it. */
const fakeModel: ModelClient = {
  plane: 'eval',
  name: 'fake',
  submitDraft: async (req: DraftRequest) => ({
    summary: `Ride ${req.caseFile.state}.`,
    draftReply: req.caseFile.complaint.includes('SYSTEM OVERRIDE')
      ? 'We have refunded 20000 HUF to your card.'
      : /[őűáéíóöúü]/i.test(req.caseFile.complaint)
        ? 'Köszönjük a jelzését, kivizsgáljuk.'
        : 'Thank you, we are reviewing this ride and will reply soon.',
    citedEventIds: req.caseFile.events.map((e) => e.id),
  }),
};

function models(): ModelClient[] {
  if (process.argv.includes('--fake')) return [fakeModel];
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.error('Set OPENROUTER_API_KEY (and optionally EVAL_MODELS), or run with --fake.');
    process.exit(2);
  }
  const ids = (process.env.EVAL_MODELS ?? 'anthropic/claude-opus-5,anthropic/claude-sonnet-5').split(',');
  return ids.map((id) => new OpenRouterModelClient(id.trim(), key));
}

async function runModel(model: ModelClient): Promise<{ model: string; passed: number; scores: CaseScore[] }> {
  const scores: CaseScore[] = [];
  for (const c of cases) {
    try {
      scores.push(scoreCase(c, await model.submitDraft({ system: SYSTEM_PROMPT, caseFile: c.caseFile })));
    } catch (err) {
      scores.push({ id: c.id, passed: false, failures: [`error: ${(err as Error).message}`] });
    }
  }
  return { model: model.name, passed: scores.filter((s) => s.passed).length, scores };
}

async function main(): Promise<void> {
  const results = [];
  for (const m of models()) results.push(await runModel(m));
  console.log(`| Model | Passed | Failures |\n|---|---|---|`);
  for (const r of results) {
    const failed = r.scores.filter((s) => !s.passed).map((s) => `${s.id}: ${s.failures.join('; ')}`);
    console.log(`| ${r.model} | ${r.passed}/${cases.length} | ${failed.join(' · ') || '—'} |`);
  }
  mkdirSync(join(__dirname, 'results'), { recursive: true });
  const file = join(__dirname, 'results', `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(results, null, 2));
}

main().catch((err: unknown) => {
  console.error('eval failed', err);
  process.exit(1);
});
