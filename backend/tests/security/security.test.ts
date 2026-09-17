import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { clearDatabase, createTestBusiness, createTestUser } from '../helpers/testHelpers';
import { generateTestToken } from '../helpers/authHelpers';

describe('Security Tests', () => {
  let business: any;
  let user: any;
  let token: string;

  beforeAll(async () => {
    await clearDatabase();
    business = await createTestBusiness();
    user = await createTestUser(business.id);
    token = generateTestToken(user.id, business.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Rate Limiting', () => {
    it('should rate limit requests', async () => {
      const requests = [];

      // Make many requests quickly
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .get('/api/v1/orders')
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    });

    it('should rate limit login attempts', async () => {
      const requests = [];

      for (let i = 0; i < 25; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: 'test@user.com',
              password: 'WrongPassword123',
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((r) => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe('CORS', () => {
    it('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should have security headers', async () => {
      const response = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should reject SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/v1/customers?search=test\' OR \'1\'=\'1')
        .set('Authorization', `Bearer ${token}`);

      // Should sanitize input, not cause DB error
      expect(response.status).toBe(200);
      // The search should be sanitized, not executed as SQL
      expect(response.body.data).toBeDefined();
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize XSS attempts in input', async () => {
      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '<script>alert("XSS")</script>',
          phone: '0300-1234567',
        });

      expect(response.status).toBe(201);
      // Script tags should be sanitized
      expect(response.body.data.name).not.toContain('<script>');
    });
  });

  describe('Request Size Limits', () => {
    it('should reject large payloads', async () => {
      const largePayload = {
        customer: {
          name: 'A'.repeat(1000000), // 1MB of data
          phone: '0300-1234567',
        },
        items: [{ productId: 'test', quantity: 1 }],
        paymentMethod: 'COD',
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(largePayload);

      expect(response.status).toBe(413); // Payload Too Large
    });
  });
});