import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [UsersModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
