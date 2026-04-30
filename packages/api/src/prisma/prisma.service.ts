import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected');

    // Log slow queries in development
    if (process.env.NODE_ENV !== 'production') {
      (this.$on as any)('query', (event: any) => {
        const threshold = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '200');
        if (event.duration > threshold) {
          this.logger.warn(`🐌 Slow query (${event.duration}ms): ${event.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  // MongoDB cleanup would use collections instead of tables
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase() can only be called in test environment!');
    }
    // Implement MongoDB collection drop logic here if needed for tests
  }
}
