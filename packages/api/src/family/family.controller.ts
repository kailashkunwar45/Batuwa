import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FamilyService } from './family.service';

@ApiTags('family')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get() getLinks(@Request() req: any) { return this.familyService.getLinks(req.user.id); }

  @Post('link')
  link(@Request() req: any, @Body() body: { childId: string; dailyLimit?: number; monthlyLimit?: number }) {
    return this.familyService.linkMember(req.user.id, body.childId, body);
  }

  @Delete('link/:childId')
  remove(@Request() req: any, @Param('childId') childId: string) {
    return this.familyService.removeLink(req.user.id, childId);
  }
}
