import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus, Headers, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { PayBillDto } from './dto/pay-bill.dto';
import { InquireDto } from './dto/inquire.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get all bill providers grouped by category' })
  getProviders() {
    return this.paymentsService.getAllProviders();
  }

  @Get('providers/:category')
  @ApiOperation({ summary: 'Get providers by category (MOBILE_TOPUP, ELECTRICITY, etc.)' })
  getByCategory(@Param('category') category: string) {
    return this.paymentsService.getProvidersByCategory(category);
  }

  @Post('qr/scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parse a QR code string for merchant/user data' })
  scanQR(@Body('qrData') qrData: string) {
    return this.paymentsService.scanQR(qrData);
  }

  @Post('merchant/pay')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Pay a merchant via QR' })
  payMerchant(
    @Request() req: any,
    @Body() dto: { merchantId: string; amount: number; note?: string },
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    if (!idempotencyKey) throw new BadRequestException('X-Idempotency-Key header required');
    return this.paymentsService.payMerchant(req.user.id, { ...dto, idempotencyKey });
  }

  @Post('inquire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch bill details before payment (pre-inquiry)' })
  inquire(@Request() req: any, @Body() dto: InquireDto) {
    return this.paymentsService.inquire(req.user.id, dto.providerId, dto.accountRef, dto.params);
  }

  @Post('pay')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 10 } }) // Max 10 attempts per minute
  @ApiOperation({ summary: 'Pay a bill — requires X-Idempotency-Key header' })
  pay(
    @Request() req: any,
    @Body() dto: PayBillDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
  ) {
    if (!idempotencyKey) throw new Error('X-Idempotency-Key header required');
    return this.paymentsService.payBill(req.user.id, { ...dto, idempotencyKey });
  }

  @Get('history')
  @ApiOperation({ summary: 'Get bill payment history' })
  getHistory(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.paymentsService.getHistory(req.user.id, +page, +limit);
  }

  @Get('status/:id')
  @ApiOperation({ summary: 'Get transaction status with full lifecycle timeline' })
  getStatus(@Request() req: any, @Param('id') id: string) {
    return this.paymentsService.getTransactionStatus(req.user.id, id);
  }
}
