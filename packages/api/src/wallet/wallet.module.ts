import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { FraudModule } from '../fraud/fraud.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';

import { NCHLAdapter } from './adapters/nchl.adapter';

@Module({
  imports: [FraudModule, NotificationsModule, EventsModule],
  controllers: [WalletController],
  providers: [WalletService, NCHLAdapter],
  exports: [WalletService],
})
export class WalletModule {}
