import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_ADMIN_URL: z.string().url(),
  APP_DB_PASSWORD: z.string().min(8),
  REDIS_URL: z.string().url(),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  // The slice trusts identity headers instead of verifying tokens. It must be
  // switched on deliberately so it can never run as if it were the real API.
  SLICE_INSECURE_IDENTITY: z.literal('true', {
    error: 'must be "true": the slice trusts unauthenticated identity and is for local measurement only',
  }),
});

export interface Config {
  readonly databaseUrl: string;
  readonly databaseAdminUrl: string;
  readonly appDbPassword: string;
  readonly redisUrl: string;
  readonly port: number;
}

/** Validates the environment once at start-up; a missing value stops the process. */
export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid configuration: ${fields}`);
  }
  const e = parsed.data;
  return {
    databaseUrl: e.DATABASE_URL,
    databaseAdminUrl: e.DATABASE_ADMIN_URL,
    appDbPassword: e.APP_DB_PASSWORD,
    redisUrl: e.REDIS_URL,
    port: e.PORT,
  };
}
