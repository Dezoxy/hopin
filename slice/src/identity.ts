import { z } from 'zod';

/**
 * Stand-in for the Cognito token: the slice trusts identity headers and socket
 * auth fields. Production validates a JWT and reads the tenant claim (ADR 6, ADR 9).
 */
const id = z.string().min(1).max(64).regex(/^[\w-]+$/);

export const passengerIdentity = z.object({ tenantId: id, passengerId: id });
export const driverIdentity = z.object({ tenantId: id, driverId: id });
export type PassengerIdentity = z.infer<typeof passengerIdentity>;
export type DriverIdentity = z.infer<typeof driverIdentity>;

export const latLng = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});
