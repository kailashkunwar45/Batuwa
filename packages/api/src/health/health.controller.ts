import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'K-Kollection API', timestamp: new Date().toISOString(), version: '1.0.0' };
  }

  @Get('ready')
  ready() { return { status: 'ready' }; }
}
