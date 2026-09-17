import { prisma } from '../../src/config/database';
import { hash } from 'bcryptjs';

export const clearDatabase = async () => {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map((row: { tablename: string }) => row.tablename)
    .filter((name: string) => name !== '_prisma_migrations')
    .map((name: string) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log('Error clearing database:', error);
  }
};

export const createTestBusiness = async (data?: any) => {
  const defaultData = {
    name: 'Test Business',
    phone: '0300-1234567',
    email: 'test@business.com',
    address: '123 Test Street',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
  };

  const business = await prisma.business.create({
    data: { ...defaultData, ...data },
  });

  return business;
};

export const createTestUser = async (businessId: string, data?: any) => {
  const defaultData = {
    name: 'Test User',
    email: 'test@user.com',
    passwordHash: await hash('Test@123', 12),
    role: 'OWNER',
    status: 'ACTIVE',
  };

  const user = await prisma.user.create({
    data: {
      ...defaultData,
      ...data,
      businessId,
    },
  });

  return user;
};

export const createTestCustomer = async (businessId: string, data?: any) => {
  const defaultData = {
    name: 'Test Customer',
    phone: '0300-7654321',
    email: 'customer@test.com',
    address: '456 Customer Lane',
    status: 'ACTIVE',
  };

  const customer = await prisma.customer.create({
    data: { ...defaultData, ...data, businessId },
  });

  return customer;
};

export const createTestProduct = async (businessId: string, data?: any) => {
  const defaultData = {
    name: 'Test Product',
    sku: 'TEST-001',
    price: 1000,
    costPrice: 700,
    currentStock: 50,
    lowStockThreshold: 5,
    status: 'ACTIVE',
  };

  const product = await prisma.product.create({
    data: { ...defaultData, ...data, businessId },
  });

  return product;
};

export const createTestOrder = async (
  businessId: string,
  customerId: string,
  productId: string,
  data?: any
) => {
  const orderNumber = `#${Math.floor(Math.random() * 9999 + 1000)}`;

  const order = await prisma.order.create({
    data: {
      businessId,
      customerId,
      orderNumber,
      status: 'NEW',
      subtotal: 1000,
      deliveryFee: 200,
      total: 1200,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      customerName: 'Test Customer',
      customerPhone: '0300-7654321',
      ...data,
      items: {
        create: {
          productId,
          quantity: 1,
          unitPrice: 1000,
          totalPrice: 1000,
          productName: 'Test Product',
        },
      },
    },
    include: {
      items: true,
    },
  });

  return order;
};

export const createTestPayment = async (orderId: string, businessId: string, data?: any) => {
  const payment = await prisma.payment.create({
    data: {
      orderId,
      businessId,
      amount: 1200,
      method: 'COD',
      status: 'PAID',
      paidAt: new Date(),
      ...data,
    },
  });

  return payment;
};

export const createTestDelivery = async (orderId: string, businessId: string, data?: any) => {
  const delivery = await prisma.delivery.create({
    data: {
      orderId,
      businessId,
      courier: 'TCS',
      trackingNumber: '123456789',
      status: 'PENDING',
      deliveryFee: 200,
      ...data,
    },
  });

  return delivery;
};