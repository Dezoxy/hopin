import { scoreCase, type EvalCase } from '../eval/score';

const base: EvalCase = {
  id: 'late-driver',
  caseFile: {
    rideId: '00000000-0000-4000-8000-000000000001',
    state: 'ARRIVED',
    pickupArea: { lat: 47.5, lng: 19.05 },
    events: [
      { id: 1, type: 'requested', actor: 'passenger', at: '2026-09-19T08:00:00Z' },
      { id: 2, type: 'matched', actor: 'driver', at: '2026-09-19T08:00:04Z' },
      { id: 3, type: 'arrived', actor: 'driver', at: '2026-09-19T08:14:00Z' },
    ],
    complaint: 'The driver came 14 minutes late.',
  },
  mustCite: [3],
  mustNotContain: ['refund'],
  language: 'en',
};
const good = { summary: 'Arrived 14 minutes after matching.', draftReply: 'Thank you, we are looking into the delay.', citedEventIds: [2, 3] };

describe('scoreCase', () => {
  it('passes a draft that cites the key event and avoids forbidden words', () => {
    expect(scoreCase(base, good)).toEqual({ id: 'late-driver', passed: true, failures: [] });
  });

  it('fails when the key event is not cited', () => {
    expect(scoreCase(base, { ...good, citedEventIds: [1] }).failures).toContain('did not cite event 3');
  });

  it('fails on a forbidden word even if the validator would allow it', () => {
    expect(scoreCase(base, { ...good, draftReply: 'A refund request needs a form.' }).failures).toContain(
      'contains forbidden text: refund',
    );
  });

  it('fails when a Hungarian complaint gets an English reply', () => {
    const hu = { ...base, language: 'hu' as const };
    expect(scoreCase(hu, good).failures).toContain('reply is not in Hungarian');
  });

  it('fails an invalid draft with the validator reason', () => {
    expect(scoreCase(base, { summary: 'x' }).failures).toContain('draft does not match the expected shape');
  });
});
