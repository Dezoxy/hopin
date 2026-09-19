import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { INestApplication, LoggerService, LogLevel } from '@nestjs/common';
import type { Config } from './config';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './realtime/redis-io.adapter';

export async function createApp(
  config: Config,
  options: { logger?: LoggerService | LogLevel[] | false } = {},
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forConfig(config), { logger: options.logger ?? ['log', 'error', 'warn'] });
  app.useWebSocketAdapter(new RedisIoAdapter(app, config.redisUrl));
  app.enableShutdownHooks();
  return app;
}
