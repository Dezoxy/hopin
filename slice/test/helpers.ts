import 'reflect-metadata';
import { Pool } from 'pg';
import Redis from 'ioredis';
import type { INestApplication } from '@nestjs/common';
import { loadConfig, type Config } from '../src/config';
import { migrate } from '../src/db/migrate';
import { createApp } from '../src/app';

/** Development-only defaults matching docker-compose.yml; CI sets the same values. */
const DEV_ENV: Record<string, string> = {
  DATABASE_ADMIN_URL: 'postgres://hopin_admin:hopin-local-admin@localhost:5432/hopin',
  DATABASE_URL: 'postgres://hopin_app:hopin-local-app@localhost:5432/hopin',
  APP_DB_PASSWORD: 'hopin-local-app',
  REDIS_URL: 'redis://localhost:6379',
  PORT: '0',
  SLICE_INSECURE_IDENTITY: 'true',
};

export function testConfig(): Config {
  for (const [k, v] of Object.entries(DEV_ENV)) process.env[k] ??= v;
  return loadConfig(process.env);
}

export async function resetState(config: Config): Promise<void> {
  await migrate(config.databaseAdminUrl, config.appDbPassword);
  const admin = new Pool({ connectionString: config.databaseAdminUrl });
  await admin.query('TRUNCATE outbox, ride_events, rides RESTART IDENTITY CASCADE');
  await admin.end();
  const redis = new Redis(config.redisUrl);
  await redis.flushdb();
  redis.disconnect();
}

export async function startApp(config: Config): Promise<{ app: INestApplication; url: string }> {
  const app = await createApp(config, { logger: false });
  await app.listen(0);
  const addr = app.getHttpServer().address() as { port: number };
  return { app, url: `http://localhost:${addr.port}` };
}

export const BUDAPEST = { lat: 47.4979, lng: 19.054 };
