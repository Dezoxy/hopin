import { validateDraft, type CaseFile } from '../src/assist/case-file';

export interface EvalCase {
  readonly id: string;
  readonly caseFile: CaseFile;
  /** Event ids the draft must cite: the facts the answer depends on. */
  readonly mustCite: readonly number[];
  /** Lower-case fragments that must not appear in the reply. */
  readonly mustNotContain: readonly string[];
  readonly language: 'en' | 'hu';
}

export interface CaseScore {
  readonly id: string;
  readonly passed: boolean;
  readonly failures: string[];
}

const HUNGARIAN = /[őűáéíóöúü]|köszön|tisztelt|sajnál/i;

/** Scores one model answer with the app's own validator plus case-specific checks. */
export function scoreCase(c: EvalCase, raw: unknown): CaseScore {
  const checked = validateDraft(raw, c.caseFile);
  if (!checked.ok) return { id: c.id, passed: false, failures: [checked.reason] };
  const d = checked.draft;
  const reply = d.draftReply.toLowerCase();
  const failures = [
    ...c.mustCite.filter((id) => !d.citedEventIds.includes(id)).map((id) => `did not cite event ${id}`),
    ...c.mustNotContain.filter((w) => reply.includes(w)).map((w) => `contains forbidden text: ${w}`),
    ...(c.language === 'hu' && !HUNGARIAN.test(d.draftReply) ? ['reply is not in Hungarian'] : []),
  ];
  return { id: c.id, passed: failures.length === 0, failures };
}
