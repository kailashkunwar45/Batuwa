import { Injectable, NestMiddleware, ConflictException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';

// ═══════════════════════════════════════════════════════════════════
// IDEMPOTENCY MIDDLEWARE — The most critical payment safety mechanism
// Ensures: sending the same request twice = same result, no duplicates
//
// HOW IT WORKS:
// 1. Client sends X-Idempotency-Key: <uuid> header
// 2. First request: we process it normally
// 3. Same key again within 24h: return the cached response
// 4. Client can safely retry without fear of duplicate charges
// ═══════════════════════════════════════════════════════════════════

const IDEMPOTENT_METHODS = ['POST', 'PUT', 'PATCH'];
const IDEMPOTENT_ROUTES = [
  '/wallet/send',
  '/wallet/add-money',
  '/wallet/vaults',
  '/merchants/pay',
  '/payments/pay',
];

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly PREFIX = 'idempotency:middleware:';

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only apply to mutating methods on payment routes
    const isIdempotentRoute = IDEMPOTENT_ROUTES.some((route) =>
      req.path.includes(route),
    );

    if (!IDEMPOTENT_METHODS.includes(req.method) || !isIdempotentRoute) {
      return next();
    }

    const idempotencyKey = req.headers['x-idempotency-key'] as string;

    // Require idempotency key on payment mutations
    if (!idempotencyKey) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Bad Request',
        message: 'X-Idempotency-Key header is required for payment operations.',
        code: 'IDEMPOTENCY_KEY_MISSING',
      });
    }

    if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      return res.status(400).json({
        statusCode: 400,
        message: 'X-Idempotency-Key must be between 8 and 128 characters.',
      });
    }

    const cacheKey = `${this.PREFIX}${idempotencyKey}`;
    const cached = await this.redis.get<{
      status: string;
      statusCode: number;
      body: object;
    }>(cacheKey);

    // Return cached response if found
    if (cached) {
      if (cached.status === 'processing') {
        return res.status(409).json({
          statusCode: 409,
          message: 'This request is currently being processed. Please wait.',
          code: 'IDEMPOTENCY_IN_PROGRESS',
        });
      }

      res.setHeader('X-Idempotent-Replayed', 'true');
      return res.status(cached.statusCode).json(cached.body);
    }

    // Mark as processing
    const ttl = this.config.get<number>('IDEMPOTENCY_CACHE_TTL', 86400);
    await this.redis.set(cacheKey, { status: 'processing' }, 60); // 60s lock

    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      const statusCode = res.statusCode;
      // Cache successful responses
      if (statusCode >= 200 && statusCode < 300) {
        this.redis
          .set(cacheKey, { status: 'done', statusCode, body }, ttl)
          .catch(console.error);
      } else {
        // Delete lock on error so client can retry
        this.redis.del(cacheKey).catch(console.error);
      }
      return originalJson(body);
    };

    next();
  }
}
