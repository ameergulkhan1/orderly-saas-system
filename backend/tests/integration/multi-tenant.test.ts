import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import {
  clearDatabase,
  createTestBusiness,
  createTestUser,
  createTestCustomer,
  createTestProduct,
  createTestOrder,
} from '../helpers/testHelpers';
import { generateTestToken } from '../helpers/authHelpers';

describe('Multi-Tenancy Security - Integration Tests', () => {
  let businessA: any;
  let businessB: any;
  let userA: any;
  let userB: any;
  let customerA: any;
  let customerB: any;
  let productA: any;
  let productB: any;
  let orderA: any;
  let orderB: any;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    await clearDatabase();

    // Create Business A
    businessA = await createTestBusiness({ name: 'Business A' });
    userA = await createTestUser(businessA.id, { email: 'userA@test.com', name: 'User A' });
    customerA = await createTestCustomer(businessA.id, { name: 'Customer A' });
    productA = await createTestProduct(businessA.id, { name: 'Product A' });
    orderA = await createTestOrder(businessA.id, customerA.id, productA.id);
    tokenA = generateTestToken(userA.id, businessA.id);

    // Create Business B
    businessB = await createTestBusiness({ name: 'Business B' });
    userB = await createTestUser(businessB.id, { email: 'userB@test.com', name: 'User B' });
    customerB = await createTestCustomer(businessB.id, { name: 'Customer B' });
    productB = await createTestProduct(businessB.id, { name: 'Product B' });
    orderB = await createTestOrder(businessB.id, customerB.id, productB.id);
    tokenB = generateTestToken(userB.id, businessB.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Order Multi-Tenancy', () => {
    it('Business A should access only its own orders', async () => {
      // Should access its own order
      const ownOrder = await request(app)
        .get(`/api/v1/orders/${orderA.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(ownOrder.status).toBe(200);
      expect(ownOrder.body.data.id).toBe(orderA.id);

      // Should NOT access Business B's order
      const otherOrder = await request(app)
        .get(`/api/v1/orders/${orderB.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(otherOrder.status).toBe(404);
    });

    it('Business B should access only its own orders', async () => {
      // Should access its own order
      const ownOrder = await request(app)
        .get(`/api/v1/orders/${orderB.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(ownOrder.status).toBe(200);
      expect(ownOrder.body.data.id).toBe(orderB.id);

      // Should NOT access Business A's order
      const otherOrder = await request(app)
        .get(`/api/v1/orders/${orderA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(otherOrder.status).toBe(404);
    });

    it('should not allow Business B to update Business A order status', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderA.id}/status`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(404);
    });
  });

  describe('Customer Multi-Tenancy', () => {
    it('Business A should access only its own customers', async () => {
      const ownCustomer = await request(app)
        .get(`/api/v1/customers/${customerA.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(ownCustomer.status).toBe(200);
      expect(ownCustomer.body.data.id).toBe(customerA.id);

      const otherCustomer = await request(app)
        .get(`/api/v1/customers/${customerB.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(otherCustomer.status).toBe(404);
    });

    it('Business B should access only its own customers', async () => {
      const ownCustomer = await request(app)
        .get(`/api/v1/customers/${customerB.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(ownCustomer.status).toBe(200);
      expect(ownCustomer.body.data.id).toBe(customerB.id);

      const otherCustomer = await request(app)
        .get(`/api/v1/customers/${customerA.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(otherCustomer.status).toBe(404);
    });

    it('should not allow Business B to update Business A customer', async () => {
      const response = await request(app)
        .patch(`/api/v1/customers/${customerA.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked Customer' });

      expect(response.status).toBe(404);
    });
  });

  describe('Product Multi-Tenancy', () => {
    it('Business A should access only its own products', async () => {
      const ownProduct = await request(app)
        .get(`/api/v1/products/${productA.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(ownProduct.status).toBe(200);
      expect(ownProduct.body.data.id).toBe(productA.id);

      const otherProduct = await request(app)
        .get(`/api/v1/products/${productB.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(otherProduct.status).toBe(404);
    });
  });

  describe('List endpoints with multi-tenancy', () => {
    it('Business A should only see its own orders in list', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(orderA.id);
    });

    it('Business B should only see its own orders in list', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(orderB.id);
    });
  });
});