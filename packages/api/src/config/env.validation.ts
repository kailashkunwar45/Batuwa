import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Zod Schema — validates ALL env vars at startup
// If any required variable is missing or wrong → server refuses to start
// ═══════════════════════════════════════════════════════════════

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
  PORT: z.string().default('3000'),
  APP_NAME: z.string().default('KKollection'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z.string().optional(),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SLOW_QUERY_THRESHOLD_MS: z.coerce.number().default(200),

  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  JWT_KEY_VERSION: z.coerce.number().default(1),

  // Encryption (domain-separated keys)
  ENCRYPTION_KEY_USER_DATA: z.string().min(32, 'ENCRYPTION_KEY_USER_DATA is required'),
  ENCRYPTION_KEY_KYC: z.string().min(32, 'ENCRYPTION_KEY_KYC is required'),
  ENCRYPTION_KEY_TRANSACTION: z.string().min(32, 'ENCRYPTION_KEY_TRANSACTION is required'),

  // OTP
  OTP_EXPIRES_MINUTES: z.coerce.number().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  OTP_TEST_MODE: z.coerce.boolean().default(false),
  OTP_TEST_CODE: z.string().default('123456'),
  OTP_TEST_MODE_ALLOWED_ENV: z.string().default('development,test'),

  // Email (SendGrid)
  SENDGRID_API_KEY: z.string().min(1, 'SENDGRID_API_KEY is required'),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email'),
  EMAIL_FROM_NAME: z.string().default('K-Kollection'),

  // SMS - Twilio (optional in MVP — Phase 2)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SMS_ENABLED: z.coerce.boolean().default(false),

  // Storage — Cloudinary (free MVP)
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  STORAGE_PROVIDER: z.enum(['cloudinary', 's3', 'r2', 'local']).default('cloudinary'),

  // Firebase (FCM push notifications)
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),
  FCM_ENABLED: z.coerce.boolean().default(true),

  // BullMQ
  BULLMQ_CONCURRENCY: z.coerce.number().default(10),
  BULLMQ_PAYMENT_CONCURRENCY: z.coerce.number().default(5),
  BULLMQ_NOTIFICATION_CONCURRENCY: z.coerce.number().default(20),
  JOB_RETRY_ATTEMPTS: z.coerce.number().default(3),
  JOB_RETRY_BACKOFF_MS: z.coerce.number().default(5000),

  // Event Bus
  EVENT_BUS: z.enum(['redis_streams', 'kafka']).default('redis_streams'),

  // Idempotency
  IDEMPOTENCY_ENABLED: z.coerce.boolean().default(true),
  IDEMPOTENCY_CACHE_TTL: z.coerce.number().default(86400),

  // Transaction settings
  TXN_MAX_RETRIES: z.coerce.number().default(3),
  TXN_TIMEOUT_MS: z.coerce.number().default(30000),
  TXN_PENDING_EXPIRY_MINUTES: z.coerce.number().default(15),

  // Ledger integrity flags (BANK-GRADE)
  LEDGER_STRICT_MODE: z.coerce.boolean().default(true),
  LEDGER_AUTO_RECONCILIATION: z.coerce.boolean().default(true),
  LEDGER_IMMUTABILITY: z.coerce.boolean().default(true),
  LEDGER_DOUBLE_ENTRY_VALIDATION: z.coerce.boolean().default(true),

  // Reconciliation
  RECONCILIATION_CRON: z.string().default('0 2 * * *'),
  RECONCILIATION_AUTO_FIX_THRESHOLD: z.coerce.number().default(1.0),
  RECONCILIATION_ALERT_EMAIL: z.string().email().optional(),

  // Fraud Engine
  FRAUD_ENGINE_MODE: z.enum(['rules_only', 'hybrid', 'ml']).default('rules_only'),
  FRAUD_AUTO_FREEZE_SCORE: z.coerce.number().min(0).max(1).default(0.9),
  FRAUD_AUTO_FLAG_SCORE: z.coerce.number().min(0).max(1).default(0.7),
  FRAUD_LARGE_TXN_THRESHOLD: z.coerce.number().default(50000),
  FRAUD_FREEZE_MODE: z.enum(['automatic', 'manual', 'notify_only']).default('automatic'),

  // Risk Weights
  RISK_WEIGHT_NEW_DEVICE: z.coerce.number().default(0.20),
  RISK_WEIGHT_UNUSUAL_HOUR: z.coerce.number().default(0.20),
  RISK_WEIGHT_LARGE_AMOUNT: z.coerce.number().default(0.30),
  RISK_WEIGHT_IP_MISMATCH: z.coerce.number().default(0.20),
  RISK_WEIGHT_VELOCITY_BREACH: z.coerce.number().default(0.30),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_OTP_MAX: z.coerce.number().default(3),
  RATE_LIMIT_TXN_PER_HOUR: z.coerce.number().default(10),
  RATE_LIMIT_TXN_PER_DAY: z.coerce.number().default(50),

  // KYC Transaction Limits (NPR)
  KYC_L0_DAILY_LIMIT: z.coerce.number().default(1000),
  KYC_L0_MONTHLY_LIMIT: z.coerce.number().default(5000),
  KYC_L1_DAILY_LIMIT: z.coerce.number().default(10000),
  KYC_L1_MONTHLY_LIMIT: z.coerce.number().default(50000),
  KYC_L2_DAILY_LIMIT: z.coerce.number().default(100000),
  KYC_L2_MONTHLY_LIMIT: z.coerce.number().default(500000),
  KYC_L3_DAILY_LIMIT: z.coerce.number().default(500000),
  KYC_L3_MONTHLY_LIMIT: z.coerce.number().default(2000000),

  // AI Service
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AI_SERVICE_API_KEY: z.string().default('dev-ai-key'),
  AI_ENABLED: z.coerce.boolean().default(true),
  AI_ENABLE_REALTIME: z.coerce.boolean().default(false),
  AI_MODEL_VERSION: z.string().default('v1'),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.75),
  AI_TIMEOUT_MS: z.coerce.number().default(5000),

  // OpenAI (Phase 4 — optional)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // Stream (New)
  STREAM_API_KEY: z.string().optional(),
  STREAM_API_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),

  // Search — Meilisearch
  MEILISEARCH_URL: z.string().default('http://localhost:7700'),
  MEILISEARCH_MASTER_KEY: z.string().default('kkmeilikey123456'),
  SEARCH_ENABLED: z.coerce.boolean().default(false),

  // Caching
  CACHE_ENABLED: z.coerce.boolean().default(true),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  CACHE_TTL_BALANCE_SECONDS: z.coerce.number().default(10),
  CACHE_TTL_PROVIDERS_SECONDS: z.coerce.number().default(3600),

  // Payment Gateways (Phase 6 — all optional for MVP)
  PAYMENT_GATEWAY: z.enum(['mock', 'khalti', 'fonepay', 'connectips']).default('mock'),
  KHALTI_SECRET_KEY: z.string().optional(),
  KHALTI_PUBLIC_KEY: z.string().optional(),
  KHALTI_SANDBOX: z.coerce.boolean().default(true),
  FONEPAY_MERCHANT_CODE: z.string().optional(),
  FONEPAY_SECRET_KEY: z.string().optional(),

  // Analytics
  ANALYTICS_ENABLED: z.coerce.boolean().default(true),
  USER_BEHAVIOR_TRACKING: z.coerce.boolean().default(true),

  // Observability
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
  LOG_FORMAT: z.enum(['pretty', 'json']).default('pretty'),
  ENABLE_AUDIT_LOGS: z.coerce.boolean().default(true),
  SENTRY_DSN: z.string().optional(),
  METRICS_ENABLED: z.coerce.boolean().default(true),

  // Backup (Phase 5)
  BACKUP_ENABLED: z.coerce.boolean().default(false),
  BACKUP_S3_BUCKET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  // Safety check: if OTP_TEST_MODE=true, must not be in production
  if (config.OTP_TEST_MODE === 'true' && config.NODE_ENV === 'production') {
    console.error('🚨 CRITICAL: OTP_TEST_MODE cannot be enabled in production!');
    process.exit(1);
  }

  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('\n❌ Invalid environment configuration. Server cannot start.\n');
    const errors = result.error.flatten().fieldErrors;
    Object.entries(errors).forEach(([field, messages]) => {
      console.error(`  ✗ ${field}: ${messages?.join(', ')}`);
    });
    console.error('\nCheck your .env.development file and try again.\n');
    process.exit(1);
  }

  console.log('✅ Environment configuration validated successfully');
  return result.data;
}
