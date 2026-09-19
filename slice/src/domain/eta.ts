import { haversineMeters, type LatLng } from './geo';

export interface Candidate {
  readonly driverId: string;
  readonly position: LatLng;
}

/**
 * Travel-time estimate between two points. Production uses road ETAs with
 * traffic (constraint C-04, Mapbox Matrix); the slice uses straight-line
 * distance at an average speed, which is why its ranking is not road-accurate.
 */
export interface EtaProvider {
  etaSeconds(from: LatLng, to: LatLng): number;
}

export function straightLineEta(speedKmh: number): EtaProvider {
  if (!(speedKmh > 0)) throw new Error('speed must be positive');
  const metersPerSecond = (speedKmh * 1000) / 3600;
  return { etaSeconds: (from, to) => haversineMeters(from, to) / metersPerSecond };
}

/** Candidates sorted by ETA to the pickup, fastest first. Returns a new array. */
export function rankByEta(
  candidates: readonly Candidate[],
  pickup: LatLng,
  eta: EtaProvider,
): Candidate[] {
  return candidates
    .map((c) => ({ c, seconds: eta.etaSeconds(c.position, pickup) }))
    .sort((a, b) => a.seconds - b.seconds)
    .map(({ c }) => c);
}
