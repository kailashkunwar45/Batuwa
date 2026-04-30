#!/usr/bin/env node

/**
 * K-Kollection FinTech — Quick Start Script
 * Guides you through first-time setup step by step
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

console.log('\n🚀 K-Kollection FinTech — First Time Setup\n');
console.log('═'.repeat(50));

// ── Step 1: Check Docker ──────────────────────────────────────
console.log('\n📋 Step 1: Checking Docker...');
try {
  execSync('docker --version', { stdio: 'ignore' });
  console.log('  ✅ Docker is installed');
} catch {
  console.error('  ❌ Docker not found. Install Docker Desktop first: https://docker.com');
  process.exit(1);
}

// ── Step 2: Generate secrets ──────────────────────────────────
console.log('\n🔐 Step 2: Generated secret templates...');
const jwtAccess = crypto.randomBytes(64).toString('hex');
const jwtRefresh = crypto.randomBytes(64).toString('hex');
const encUser = crypto.randomBytes(32).toString('hex');
const encKyc = crypto.randomBytes(32).toString('hex');
const encTxn = crypto.randomBytes(32).toString('hex');

console.log('\n  Copy these into your .env.development file:\n');
console.log(`  JWT_ACCESS_SECRET=${jwtAccess}`);
console.log(`  JWT_REFRESH_SECRET=${jwtRefresh}`);
console.log(`  ENCRYPTION_KEY_USER_DATA=${encUser}`);
console.log(`  ENCRYPTION_KEY_KYC=${encKyc}`);
console.log(`  ENCRYPTION_KEY_TRANSACTION=${encTxn}`);

// ── Step 3: Check .env.development ───────────────────────────
console.log('\n\n📄 Step 3: Checking .env.development...');
const envPath = path.join(ROOT, 'packages/api/.env.development');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  const hasPlaceholders = content.includes('REPLACE_WITH');
  if (hasPlaceholders) {
    console.log('  ⚠️  You still have REPLACE_WITH placeholders in .env.development');
    console.log('  → Fill these in before running: npm run docker:up');
    console.log('\n  Required services to sign up for (all FREE):');
    console.log('    1. SendGrid: https://sendgrid.com → API Key');
    console.log('    2. Cloudinary: https://cloudinary.com → Cloud Name + API Key + Secret');
    console.log('    3. Firebase: https://console.firebase.google.com → Service Account JSON');
  } else {
    console.log('  ✅ .env.development looks filled in');
  }
} else {
  console.log('  ❌ .env.development not found at:', envPath);
}

// ── Step 4: Instructions ──────────────────────────────────────
console.log('\n\n📝 Step 4: Run these commands in order:\n');
console.log('  1. Fill in your .env.development file (see Step 3 above)');
console.log('  2. npm run docker:up          ← Start PostgreSQL + Redis + Meilisearch');
console.log('  3. npm run db:migrate         ← Apply database schema');
console.log('  4. npm run db:seed            ← Load test data');
console.log('  5. cd packages/api && npm run dev  ← Start API server');
console.log('\n  Then open: http://localhost:3000/api/docs  ← Swagger UI\n');

console.log('═'.repeat(50));
console.log('🎯 Once running, test with: POST /api/v1/auth/send-otp');
console.log('   Use OTP: 123456 (test mode)\n');
