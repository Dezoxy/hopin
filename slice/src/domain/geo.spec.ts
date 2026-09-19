import { haversineMeters } from './geo';

describe('haversineMeters', () => {
  it('returns about 2.6 km between Deák Ferenc tér and Hősök tere', () => {
    // Arrange
    const deak = { lat: 47.4979, lng: 19.054 };
    const hosok = { lat: 47.5149, lng: 19.0778 };

    // Act
    const meters = haversineMeters(deak, hosok);

    // Assert: reference 2,602 m computed independently
    expect(meters).toBeGreaterThan(2602 * 0.99);
    expect(meters).toBeLessThan(2602 * 1.01);
  });

  it('returns zero for the same point', () => {
    const p = { lat: 47.5, lng: 19.05 };
    expect(haversineMeters(p, p)).toBe(0);
  });
});
