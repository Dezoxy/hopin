/** Ride states from plan Part A6. */
export type RideState =
  | 'REQUESTED'
  | 'MATCHED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NO_DRIVER'
  | 'CANCELLED_BY_PASSENGER'
  | 'CANCELLED_BY_DRIVER';

const TRANSITIONS: Readonly<Record<RideState, readonly RideState[]>> = {
  REQUESTED: ['MATCHED', 'NO_DRIVER', 'CANCELLED_BY_PASSENGER'],
  MATCHED: ['ARRIVED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  NO_DRIVER: [],
  CANCELLED_BY_PASSENGER: [],
  CANCELLED_BY_DRIVER: [],
};

export function canTransition(from: RideState, to: RideState): boolean {
  return TRANSITIONS[from].includes(to);
}
