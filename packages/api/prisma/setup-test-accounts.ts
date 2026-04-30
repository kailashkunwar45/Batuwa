import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Setting up test accounts and fake money...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Setup Admin Account
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@batuwa.com' },
    update: {},
    create: {
      email: 'admin@batuwa.com',
      phone: '9811111111',
      fullName: 'Admin User',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      kycLevel: 3,
      kycStatus: 'APPROVED'
    },
  });

  const adminWallet = await prisma.wallet.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      currency: 'NPR',
    },
  });

  // 2. Setup Kailash User Account
  const kailashUser = await prisma.user.upsert({
    where: { email: 'kailashkunwar10@email.com' },
    update: {},
    create: {
      email: 'kailashkunwar10@email.com',
      phone: '9822222222',
      fullName: 'Kailash Kunwar',
      passwordHash: hashedPassword,
      role: 'USER',
      kycLevel: 3,
      kycStatus: 'APPROVED'
    },
  });

  const kailashWallet = await prisma.wallet.upsert({
    where: { userId: kailashUser.id },
    update: {},
    create: {
      userId: kailashUser.id,
      currency: 'NPR',
    },
  });

  // 3. Inject Fake Money (10,000 NPR each) if not already injected
  const amountToInject = 10000;
  const adminReference = `SEED_ADMIN_${adminWallet.id}`;
  const kailashReference = `SEED_KAILASH_${kailashWallet.id}`;

  const adminLedgerExists = await prisma.ledgerEntry.findUnique({
    where: { reference: adminReference }
  });

  if (!adminLedgerExists) {
    await prisma.ledgerEntry.create({
      data: {
        walletId: adminWallet.id,
        type: 'CREDIT',
        amount: amountToInject,
        reference: adminReference,
        description: 'Initial Seed Money',
        category: 'OTHER'
      }
    });
    console.log(`✅ Injected ${amountToInject} NPR to Admin account`);
  }

  const kailashLedgerExists = await prisma.ledgerEntry.findUnique({
    where: { reference: kailashReference }
  });

  if (!kailashLedgerExists) {
    await prisma.ledgerEntry.create({
      data: {
        walletId: kailashWallet.id,
        type: 'CREDIT',
        amount: amountToInject,
        reference: kailashReference,
        description: 'Initial Seed Money',
        category: 'OTHER'
      }
    });
    console.log(`✅ Injected ${amountToInject} NPR to Kailash account`);
  }

  console.log('🚀 Test accounts setup complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
