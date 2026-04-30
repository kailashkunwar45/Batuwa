import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a Test User
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@batuwa.com' },
    update: {},
    create: {
      email: 'test@batuwa.com',
      phone: '9800000000',
      fullName: 'Test User',
      passwordHash: hashedPassword,
      role: 'USER',
    },
  });

  await prisma.wallet.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      currency: 'NPR',
    },
  });

  console.log(`✅ Created test user: ${testUser.email}`);

  // 2. Create an Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@batuwa.com' },
    update: {},
    create: {
      email: 'admin@batuwa.com',
      phone: '9811111111',
      fullName: 'Admin User',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });

  await prisma.wallet.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      currency: 'NPR',
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);
  console.log('🚀 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
