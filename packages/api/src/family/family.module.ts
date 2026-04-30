import { Module } from '@nestjs/common';
import { FamilyController } from './family.controller';
import { FamilyService } from './family.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({ imports: [WalletModule], controllers: [FamilyController], providers: [FamilyService] })
export class FamilyModule {}
