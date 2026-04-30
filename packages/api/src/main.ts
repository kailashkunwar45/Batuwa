import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // ─── Security ───────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
  }));

  // ─── CORS ────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:8081',
      // Allow any device on the local Wi-Fi network (192.168.x.x) — covers Expo Go on physical devices
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ─── Global prefix ───────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Global validation pipe ──────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // Strip unknown properties
      forbidNonWhitelisted: true,  // Throw if unknown properties sent
      transform: true,             // Auto-transform to DTO types
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Swagger (dev only) ──────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('K-Kollection FinTech API')
      .setDescription('Full financial operating system API for Nepal')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & OTP')
      .addTag('wallet', 'Wallet & Ledger')
      .addTag('payments', 'Bill Payments')
      .addTag('transactions', 'Transaction History')
      .addTag('kyc', 'KYC Verification')
      .addTag('ai', 'AI Insights & Predictions')
      .addTag('admin', 'Admin Control Panel')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('📖 Swagger docs available at: http://localhost:3000/api/docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 K-Kollection API running on: http://localhost:${port}/api/v1`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
