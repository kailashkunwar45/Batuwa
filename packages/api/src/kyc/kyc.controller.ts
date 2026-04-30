import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KycService } from './kyc.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('kyc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status')
  getStatus(@Request() req: any) { return this.kycService.getStatus(req.user.id); }

  @Post('level1')
  submitL1(@Request() req: any, @Body() body: { fullName: string; phone: string }) {
    return this.kycService.submitLevel1(req.user.id, body);
  }

  @Post('level2')
  submitL2(@Request() req: any, @Body() body: any) {
    return this.kycService.submitLevel2(req.user.id, { ...body, dob: new Date(body.dob) });
  }

  // ── ADMIN ENDPOINTS ──────────────────────────────────────────

  @Get('admin/pending')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  getPending(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.kycService.getPendingReviews(+page, +limit);
  }

  @Post('admin/approve/:userId')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  approve(@Param('userId') userId: string, @Request() req: any, @Body() body: { note?: string }) {
    return this.kycService.approve(userId, req.user.id, body.note);
  }

  @Post('admin/reject/:userId')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  reject(@Param('userId') userId: string, @Request() req: any, @Body() body: { reason: string }) {
    return this.kycService.reject(userId, req.user.id, body.reason);
  }
}
