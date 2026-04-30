import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RewardsService } from './rewards.service';

@ApiTags('rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('balance')
  getBalance(@Request() req: any) { return this.rewardsService.getBalance(req.user.id); }

  @Get('history')
  getHistory(@Request() req: any, @Query('page') page = 1) { return this.rewardsService.getHistory(req.user.id, +page); }
}
