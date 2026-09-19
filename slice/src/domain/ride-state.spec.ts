import { canTransition } from './ride-state';

describe('canTransition', () => {
  it.each([
    ['REQUESTED', 'MATCHED'],
    ['REQUESTED', 'NO_DRIVER'],
    ['REQUESTED', 'CANCELLED_BY_PASSENGER'],
    ['MATCHED', 'ARRIVED'],
    ['ARRIVED', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'COMPLETED'],
  ] as const)('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    ['MATCHED', 'MATCHED'],
    ['COMPLETED', 'MATCHED'],
    ['NO_DRIVER', 'MATCHED'],
    ['REQUESTED', 'COMPLETED'],
  ] as const)('rejects %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });
});
