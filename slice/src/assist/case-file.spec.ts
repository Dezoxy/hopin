import { buildCaseFile, renderCaseFile, validateDraft, type CaseFile } from './case-file';

const ride = {
  id: '11111111-1111-4111-8111-111111111111',
  tenantId: 'tenant-a',
  passengerId: 'p-4711',
  driverId: 'd-42',
  state: 'MATCHED' as const,
  pickup: { lat: 47.4979, lng: 19.054 },
};
const events = [
  { id: 1, type: 'requested', actor: 'p-4711', at: '2026-09-19T10:00:00Z' },
  { id: 2, type: 'matched', actor: 'd-42', at: '2026-09-19T10:00:05Z' },
];

describe('buildCaseFile', () => {
  it('replaces passenger and driver identifiers with roles', () => {
    const cf = buildCaseFile(ride, events, 'I waited 20 minutes');
    const text = JSON.stringify(cf);
    expect(text).not.toContain('p-4711');
    expect(text).not.toContain('d-42');
    expect(cf.events.map((e) => e.actor)).toEqual(['passenger', 'driver']);
  });

  it('removes phone numbers and e-mail addresses from the complaint', () => {
    const cf = buildCaseFile(ride, events, 'Call me on +36 30 123 4567 or anna@example.com');
    expect(cf.complaint).not.toMatch(/123 4567|example\.com/);
    expect(cf.complaint).toContain('[phone removed]');
    expect(cf.complaint).toContain('[email removed]');
  });

  it('does not send the ride ID to the model', () => {
    const text = renderCaseFile(buildCaseFile(ride, events, 'late'));
    expect(text).not.toContain(ride.id);
  });

  it('keeps only coarse pickup coordinates', () => {
    const cf = buildCaseFile(ride, events, 'late');
    expect(cf.pickupArea).toEqual({ lat: 47.5, lng: 19.05 });
  });
});

describe('validateDraft', () => {
  const cf: CaseFile = buildCaseFile(ride, events, 'late');
  const good = { summary: 'Matched after 5 s.', draftReply: 'Hello', citedEventIds: [1, 2] };

  it('accepts a draft that cites only events in the case file', () => {
    expect(validateDraft(good, cf)).toMatchObject({ ok: true });
  });

  it('rejects a draft that cites an event that does not exist', () => {
    expect(validateDraft({ ...good, citedEventIds: [1, 99] }, cf)).toEqual({
      ok: false,
      reason: 'cites events not in the case file: 99',
    });
  });

  it('rejects a draft with the wrong shape', () => {
    expect(validateDraft({ summary: 'x' }, cf)).toMatchObject({ ok: false });
  });

  it('rejects a draft that promises a refund, which only a human may decide', () => {
    const r = validateDraft({ ...good, draftReply: 'We have issued a full refund to your card.' }, cf);
    expect(r).toEqual({ ok: false, reason: 'draft promises a refund or payment; only a human may decide that' });
  });

  it.each([
    'Visszatérítettük a teljes összeget a kártyájára.',
    'A díjat jóváírjuk a következő útjára.',
  ])('rejects a Hungarian draft that promises money: %s', (draftReply) => {
    expect(validateDraft({ ...good, draftReply }, cf).ok).toBe(false);
  });

  it('accepts a Hungarian draft that only says a person will decide on a refund', () => {
    const draftReply = 'A visszatérítésről munkatársunk dönt, és hamarosan jelentkezik.';
    expect(validateDraft({ ...good, draftReply }, cf).ok).toBe(true);
  });
});
