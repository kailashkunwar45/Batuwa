import { Controller, Get, Patch, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { TxnType } from '@prisma/client';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  getAll(
    @Request() req: any,
    @Query('type') type?: TxnType,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.transactionsService.getAll(req.user.id, { type, status, page: +page, limit: +limit, search });
  }

  @Get(':id')
  getById(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.getById(req.user.id, id);
  }

  @Patch(':id/note')
  addNote(@Request() req: any, @Param('id') id: string, @Body('note') note: string) {
    return this.transactionsService.addNote(req.user.id, id, note);
  }
}
