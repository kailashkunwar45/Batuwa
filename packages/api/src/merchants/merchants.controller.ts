import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MerchantsService } from './merchants.service';

@ApiTags('merchants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get('me') getProfile(@Request() req: any) { return this.merchantsService.getProfile(req.user.id); }

  @Post('register')
  register(@Request() req: any, @Body() body: { businessName: string; businessType?: string; businessAddress?: string }) {
    return this.merchantsService.register(req.user.id, body);
  }

  @Get('lookup/:qrCode')
  lookup(@Param('qrCode') qrCode: string) {
    return this.merchantsService.findByQr(qrCode);
  }

  @Post('pay')
  pay(@Request() req: any, @Body() body: { qrCode: string; amount: number }) {
    return this.merchantsService.processPayment(body.qrCode, body.amount, req.user.id);
  }
}
