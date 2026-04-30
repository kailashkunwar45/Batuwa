import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() { return this.adminService.getDashboardStats(); }

  @Get('users')
  getUsers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    return this.adminService.getUsers(+page, +limit, search);
  }

  @Post('users/:id/freeze')
  freeze(@Param('id') id: string, @Body() body: { adminId: string; reason: string }) {
    return this.adminService.freezeUser(id, body.adminId, body.reason);
  }

  @Post('users/:id/unfreeze')
  unfreeze(@Param('id') id: string, @Body() body: { adminId: string; reason?: string }) {
    return this.adminService.unfreezeUser(id, body.adminId, body.reason);
  }

  @Get('transactions')
  getTransactions(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.getTransactionFeed(+page, +limit);
  }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.getAuditLogs(+page, +limit);
  }
}
