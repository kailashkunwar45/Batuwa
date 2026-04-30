import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaultService } from './vault.service';

@ApiTags('vaults')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vaults')
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get()
  getVaults(@Request() req: any) {
    return this.vaultService.getVaults(req.user.id);
  }

  @Post()
  createVault(@Request() req: any, @Body() body: { name: string; emoji?: string; targetAmount: number; targetDate?: Date }) {
    return this.vaultService.createVault(req.user.id, body);
  }

  @Post(':id/deposit')
  deposit(@Request() req: any, @Param('id') id: string, @Body() body: { amount: number }) {
    return this.vaultService.deposit(req.user.id, id, body.amount);
  }

  @Post(':id/withdraw')
  withdraw(@Request() req: any, @Param('id') id: string, @Body() body: { amount: number }) {
    return this.vaultService.withdraw(req.user.id, id, body.amount);
  }
}
