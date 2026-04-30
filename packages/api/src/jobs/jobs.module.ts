import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { BullModule } from '@nestjs/bullmq';
import { PAYMENT_QUEUE, PaymentProcessor } from './payment.processor';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: PAYMENT_QUEUE }),
    WalletModule,
    NotificationsModule,
    EventsModule,
  ],
  providers: [JobsService, PaymentProcessor],
  exports: [JobsService, BullModule],
})
export class JobsModule {}
