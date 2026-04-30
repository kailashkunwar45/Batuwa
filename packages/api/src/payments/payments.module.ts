import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WalletModule } from '../wallet/wallet.module';
import { FraudModule } from '../fraud/fraud.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    WalletModule, 
    FraudModule, 
    NotificationsModule, 
    EventsModule,
    BullModule.registerQueue({ name: 'payment_handling' })
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
