import { rankByEta, straightLineEta, type Candidate } from './eta';

const pickup = { lat: 47.4979, lng: 19.054 };

describe('straightLineEta', () => {
  it('converts distance to seconds at the given average speed', () => {
    const eta = straightLineEta(36); // 36 km/h = 10 m/s
    const oneKmNorth = { lat: pickup.lat + 1000 / 111_195, lng: pickup.lng };
    expect(eta.etaSeconds(oneKmNorth, pickup)).toBeCloseTo(100, 0);
  });

  it('rejects a non-positive speed', () => {
    expect(() => straightLineEta(0)).toThrow('speed must be positive');
  });
});

describe('rankByEta', () => {
  const near: Candidate = { driverId: 'near', position: { lat: 47.4985, lng: 19.0545 } };
  const mid: Candidate = { driverId: 'mid', position: { lat: 47.505, lng: 19.06 } };
  const far: Candidate = { driverId: 'far', position: { lat: 47.52, lng: 19.08 } };

  it('orders candidates by ascending ETA', () => {
    const ranked = rankByEta([far, near, mid], pickup, straightLineEta(25));
    expect(ranked.map((c) => c.driverId)).toEqual(['near', 'mid', 'far']);
  });

  it('does not mutate the input array', () => {
    const input = [far, near, mid];
    rankByEta(input, pickup, straightLineEta(25));
    expect(input.map((c) => c.driverId)).toEqual(['far', 'near', 'mid']);
  });

  it('returns an empty list when there are no candidates', () => {
    expect(rankByEta([], pickup, straightLineEta(25))).toEqual([]);
  });
});
