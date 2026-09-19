import { Module, type DynamicModule, type OnApplicationShutdown, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import type { Config } from './config';
import { MatchingService } from './matching/matching.service';
import { OutboxRelay } from './outbox/outbox.relay';
import { DriverGateway } from './realtime/driver.gateway';
import { PassengerGateway } from './realtime/passenger.gateway';
import { RealtimeBus } from './realtime/realtime.bus';
import { RidesController } from './rides/rides.controller';
import { RidesService } from './rides/rides.service';
import { PG_POOL, REDIS } from './tokens';

@Module({})
export class AppModule implements OnApplicationShutdown {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  static forConfig(config: Config): DynamicModule {
    return {
      module: AppModule,
      controllers: [RidesController],
      providers: [
        { provide: PG_POOL, useFactory: () => new Pool({ connectionString: config.databaseUrl, max: 20 }) },
        { provide: REDIS, useFactory: () => new Redis(config.redisUrl) },
        RealtimeBus,
        RidesService,
        MatchingService,
        OutboxRelay,
        DriverGateway,
        PassengerGateway,
      ],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
    this.redis.disconnect();
  }
}
