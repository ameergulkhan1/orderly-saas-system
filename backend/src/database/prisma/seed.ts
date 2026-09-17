import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test business
  const business = await prisma.business.create({
    data: {
      name: 'Test Business',
      phone: '0300-1234567',
      email: 'test@business.com',
      address: '123 Test Street, Test City',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
    },
  });

  // Create test user
  const passwordHash = await hash('Test@123', 12);
  const user = await prisma.user.create({
    data: {
      businessId: business.id,
      name: 'Test Owner',
      email: 'owner@test.com',
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
      lastLoginAt: new Date(),
    },
  });

  // Update business with owner
  await prisma.business.update({
    where: { id: business.id },
    data: { ownerId: user.id },
  });

  // Create test customer
  const customer = await prisma.customer.create({
    data: {
      businessId: business.id,
      name: 'Test Customer',
      phone: '0300-7654321',
      email: 'customer@test.com',
      address: '456 Customer Lane, Test City',
      status: 'ACTIVE',
    },
  });

  // Create test product
  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      name: 'Test Product',
      sku: 'TEST-001',
      description: 'This is a test product',
      category: 'Test Category',
      price: 1000,
      costPrice: 700,
      currentStock: 50,
      lowStockThreshold: 5,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`🔑 Test Business ID: ${business.id}`);
  console.log(`👤 Test User Email: owner@test.com`);
  console.log(`🔐 Test User Password: Test@123`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });