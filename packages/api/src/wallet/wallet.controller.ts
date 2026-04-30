import {
  Controller, Get, Post, Body, Patch, Param,
  UseGuards, Request, Headers, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { SendMoneyDto } from './dto/send-money.dto';
import { AddMoneyDto } from './dto/add-money.dto';
import { StatementQueryDto } from './dto/statement-query.dto';
import { CreateVaultDto } from './dto/create-vault.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance (computed from ledger)' })
  getBalance(@Request() req: any) {
    return this.walletService.getBalance(req.user.id);
  }

  @Post('add-money')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add money to wallet (top-up)' })
  addMoney(
    @Request() req: any,
    @Body() dto: AddMoneyDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    if (!idempotencyKey) {
      throw new Error('X-Idempotency-Key header is required');
    }
    return this.walletService.addMoney(req.user.id, dto, idempotencyKey);
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send money to another user (P2P)' })
  sendMoney(
    @Request() req: any,
    @Body() dto: SendMoneyDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    if (!idempotencyKey) {
      throw new Error('X-Idempotency-Key header is required');
    }
    return this.walletService.sendMoney(req.user.id, dto, idempotencyKey);
  }

  @Get('statement')
  @ApiOperation({ summary: 'Get wallet statement with filtering' })
  getStatement(@Request() req: any, @Query() query: StatementQueryDto) {
    return this.walletService.getStatement(req.user.id, {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      type: query.type as any,
      category: query.category as any,
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get('vaults')
  @ApiOperation({ summary: 'Get all savings vaults' })
  getVaults(@Request() req: any) {
    return this.walletService['prisma'].vault.findMany({
      where: { wallet: { userId: req.user.id } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('vaults')
  @ApiOperation({ summary: 'Create a savings vault' })
  createVault(@Request() req: any, @Body() dto: CreateVaultDto) {
    return this.walletService.createVault(req.user.id, dto);
  }

  @Post('vaults/:id/deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit money into a vault' })
  depositToVault(
    @Request() req: any,
    @Param('id') vaultId: string,
    @Body() body: { amount: number },
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    return this.walletService.depositToVault(req.user.id, vaultId, body.amount, idempotencyKey);
  }
}
