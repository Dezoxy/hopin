import { loadConfig } from './config';

const base = {
  DATABASE_URL: 'postgres://app:pw@localhost:5432/hopin',
  DATABASE_ADMIN_URL: 'postgres://admin:pw@localhost:5432/hopin',
  APP_DB_PASSWORD: 'local-password',
  REDIS_URL: 'redis://localhost:6379',
};

describe('loadConfig', () => {
  it('refuses to start without the explicit insecure-identity flag', () => {
    expect(() => loadConfig(base)).toThrow('SLICE_INSECURE_IDENTITY');
  });

  it('refuses any value other than "true"', () => {
    expect(() => loadConfig({ ...base, SLICE_INSECURE_IDENTITY: 'yes' })).toThrow('SLICE_INSECURE_IDENTITY');
  });

  it('starts when the flag is set', () => {
    expect(loadConfig({ ...base, SLICE_INSECURE_IDENTITY: 'true' }).port).toBe(3000);
  });
});
