import { loadConfig } from './config';
import { createApp } from './app';

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const app = await createApp(config);
  await app.listen(config.port);
}

main().catch((err: unknown) => {
  console.error('failed to start', err);
  process.exit(1);
});
