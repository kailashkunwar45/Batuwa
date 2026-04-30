import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { FraudService } from './fraud.service';

@ApiTags('fraud')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get('my-risk')
  getRisk(@Request() req: any) {
    return this.fraudService.getUserRiskProfile(req.user.id);
  }

  // ── ADMIN ENDPOINTS ──────────────────────────────────────────

  @Get('admin/alerts')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  getAlerts(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.fraudService.getOpenAlerts(+page, +limit);
  }

  @Post('admin/resolve/:id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  resolve(@Param('id') id: string, @Request() req: any, @Body() body: { note?: string }) {
    return this.fraudService.resolveAlert(id, req.user.id, body.note);
  }
}
