import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type { INestApplicationContext } from '@nestjs/common';
import Redis from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

/** Socket.IO with the Redis adapter, so rooms work across API tasks (ADR 5). */
export class RedisIoAdapter extends IoAdapter {
  private readonly pub: Redis;
  private readonly sub: Redis;

  constructor(app: INestApplicationContext, redisUrl: string) {
    super(app);
    this.pub = new Redis(redisUrl);
    this.sub = this.pub.duplicate();
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    server.adapter(createAdapter(this.pub, this.sub));
    return server;
  }

  override async dispose(): Promise<void> {
    this.pub.disconnect();
    this.sub.disconnect();
  }
}
