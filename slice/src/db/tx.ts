import type { Pool, PoolClient } from 'pg';

/** Runs fn in a transaction; commits on success, rolls back and rethrows on error. */
export async function withTransaction<T>(pool: Pool, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Runs fn in a transaction scoped to one tenant. Row-level security reads the
 * setting, so a query without it returns no rows instead of every row.
 */
export function withTenant<T>(pool: Pool, tenantId: string, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  return withTransaction(pool, async (client) => {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    return fn(client);
  });
}
