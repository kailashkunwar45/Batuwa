import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('insights')
  getInsights(@Request() req: any) {
    return this.aiService.getSpendingInsights(req.user.id);
  }

  @Get('health-score')
  getHealthScore(@Request() req: any) {
    return this.aiService.getFinancialHealthScore(req.user.id);
  }
}
