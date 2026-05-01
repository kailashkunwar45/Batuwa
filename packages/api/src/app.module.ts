import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.validation';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigService } from '@nestjs/config';
import { IdempotencyMiddleware } from './common/middleware/idempotency.middleware';
import { WalletModule } from './wallet/wallet.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { KycModule } from './kyc/kyc.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FraudModule } from './fraud/fraud.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { SearchModule } from './search/search.module';
import { FamilyModule } from './family/family.module';
import { RewardsModule } from './rewards/rewards.module';
import { MerchantsModule } from './merchants/merchants.module';
import { EventsModule } from './events/events.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { SocialModule } from './social/social.module';
import { VaultModule } from './vault/vault.module';

@Module({
  imports: [
    // ─── Config (validates env at startup) ─────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : `.env.${process.env.NODE_ENV || 'development'}`,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      validate: validateEnv,
      cache: true,
    }),

    // ─── Static Sites (Admin & Merchant) ────────────────────────
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', '..', '..', '..', 'apps', 'admin', 'dist'),
        serveRoot: '/admin',
        exclude: ['/api/(.*)'],
      },
      {
        rootPath: join(__dirname, '..', '..', '..', '..', 'apps', 'merchant', 'dist'),
        serveRoot: '/merchant',
        exclude: ['/api/(.*)'],
      }
    ),

    // ─── Schedule (cron jobs) ───────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Global rate limiting ───────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 1000,
      },
    ]),

    // ─── Queues (BullMQ) ────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
          password: config.get<string>('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: config.get<number>('JOB_RETRY_ATTEMPTS', 3),
          backoff: {
            type: 'exponential',
            delay: config.get<number>('JOB_RETRY_BACKOFF_MS', 5000),
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),

    // ─── Core infrastructure ────────────────────────────────────
    PrismaModule,
    RedisModule,
    EventsModule,
    JobsModule,

    // ─── Feature modules ────────────────────────────────────────
    AuthModule,
    UsersModule,
    WalletModule,
    PaymentsModule,
    TransactionsModule,
    KycModule,
    NotificationsModule,
    FraudModule,
    ReconciliationModule,
    FamilyModule,
    RewardsModule,
    MerchantsModule,
    AiModule,
    SearchModule,
    SocialModule,
    VaultModule,

    // ─── Admin & Monitoring ─────────────────────────────────────
    AdminModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IdempotencyMiddleware)
      .forRoutes('*'); // Middleware handles route filtering internally
  }
}
