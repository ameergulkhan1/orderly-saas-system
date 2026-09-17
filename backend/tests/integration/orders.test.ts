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
} from '../helpers/testHelpers';
import { generateTestToken } from '../helpers/authHelpers';

describe('Orders API - Integration Tests', () => {
  let business: any;
  let user: any;
  let customer: any;
  let product: any;
  let token: string;
  let order: any;

  beforeAll(async () => {
    await clearDatabase();

    business = await createTestBusiness();
    user = await createTestUser(business.id);
    customer = await createTestCustomer(business.id);
    product = await createTestProduct(business.id);
    token = generateTestToken(user.id, business.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/orders', () => {
    it('should create a new order', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customer: {
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
          },
          items: [
            {
              productId: product.id,
              quantity: 1,
            },
          ],
          paymentMethod: 'COD',
          deliveryFee: 200,
          notes: 'Test order',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('NEW');

      order = response.body.data;
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .send({
          customer: {
            name: customer.name,
            phone: customer.phone,
          },
          items: [
            {
              productId: product.id,
              quantity: 1,
            },
          ],
          paymentMethod: 'COD',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customer: {
            name: '',
            phone: '',
          },
          items: [],
          paymentMethod: 'INVALID',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should get all orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/orders?status=NEW')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every((o: any) => o.status === 'NEW')).toBe(true);
    });

    it('should paginate orders', async () => {
      const response = await request(app)
        .get('/api/v1/orders?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(10);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should get order by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(order.id);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/v1/orders/nonexistent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('should update order status', async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('should reject invalid status transition', async () => {
      // Try to go from CONFIRMED to DELIVERED (invalid - must go through PROCESSING, READY_TO_SHIP, SHIPPED)
      const response = await request(app)
        .patch(`/api/v1/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'DELIVERED' });

      expect(response.status).toBe(400);
    });
  });
});