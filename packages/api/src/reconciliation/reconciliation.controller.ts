import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReconciliationService } from './reconciliation.service';

@ApiTags('reconciliation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('run')
  runNow() { return this.reconciliationService.runManually(); }

  @Get('jobs')
  getJobs(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.reconciliationService.getJobHistory(+page, +limit);
  }

  @Get('alerts')
  getAlerts(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.reconciliationService.getAlerts(+page, +limit);
  }
}
