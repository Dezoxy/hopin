import { Client } from 'pg';
import { loadConfig } from '../config';

/**
 * Creates the schema as the admin role and a separate application role that
 * cannot bypass row-level security (ADR 9). Idempotent.
 */
export async function migrate(adminUrl: string, appPassword: string): Promise<void> {
  const client = new Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const pw = client.escapeLiteral(appPassword);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hopin_app') THEN
          CREATE ROLE hopin_app LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD ${pw};
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS rides (
        id           uuid PRIMARY KEY,
        tenant_id    text NOT NULL,
        passenger_id text NOT NULL,
        driver_id    text,
        state        text NOT NULL,
        pickup_lat   double precision NOT NULL,
        pickup_lng   double precision NOT NULL,
        requested_at timestamptz NOT NULL DEFAULT now(),
        matched_at   timestamptz
      );
      CREATE TABLE IF NOT EXISTS ride_events (
        id         bigserial PRIMARY KEY,
        tenant_id  text NOT NULL,
        ride_id    uuid NOT NULL REFERENCES rides(id),
        type       text NOT NULL,
        actor      text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      -- Platform-internal; read by the relay across tenants, so no RLS.
      CREATE TABLE IF NOT EXISTS outbox (
        id           bigserial PRIMARY KEY,
        tenant_id    text NOT NULL,
        type         text NOT NULL,
        payload      jsonb NOT NULL,
        created_at   timestamptz NOT NULL DEFAULT now(),
        published_at timestamptz
      );
      CREATE INDEX IF NOT EXISTS outbox_unpublished ON outbox (id) WHERE published_at IS NULL;

      ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
      ALTER TABLE rides FORCE ROW LEVEL SECURITY;
      ALTER TABLE ride_events ENABLE ROW LEVEL SECURITY;
      ALTER TABLE ride_events FORCE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS tenant_isolation ON rides;
      CREATE POLICY tenant_isolation ON rides
        USING (tenant_id = current_setting('app.tenant_id', true))
        WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
      DROP POLICY IF EXISTS tenant_isolation ON ride_events;
      CREATE POLICY tenant_isolation ON ride_events
        USING (tenant_id = current_setting('app.tenant_id', true))
        WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

      GRANT SELECT, INSERT, UPDATE ON rides, ride_events, outbox TO hopin_app;
      GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO hopin_app;
    `);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  const config = loadConfig(process.env);
  migrate(config.databaseAdminUrl, config.appDbPassword)
    .then(() => console.log('migration complete'))
    .catch((err: unknown) => {
      console.error('migration failed', err);
      process.exit(1);
    });
}
