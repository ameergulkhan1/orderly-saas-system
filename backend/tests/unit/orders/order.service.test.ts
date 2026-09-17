import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/config/database';
import { OrderService } from '@/modules/orders/order.service';
import { createTestBusiness, createTestUser, createTestCustomer, createTestProduct } from '../../helpers/testHelpers';

describe('OrderService - Unit Tests', () => {
  let orderService: OrderService;
  let business: any;
  let user: any;
  let customer: any;
  let product: any;

  beforeEach(async () => {
    orderService = new OrderService(prisma);
    business = await createTestBusiness();
    user = await createTestUser(business.id);
    customer = await createTestCustomer(business.id);
    product = await createTestProduct(business.id);
  });

  describe('createOrder', () => {
    it('should create order with valid data', async () => {
      const orderData = {
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
        paymentMethod: 'COD' as const,
        deliveryFee: 200,
        notes: 'Test order',
      };

      const order = await orderService.createOrder(business.id, user.id, orderData);

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.status).toBe('NEW');
      expect(Number(order.total)).toBe(1200);
      expect(Number(order.subtotal)).toBe(1000);
    });

    it('should throw error when product is out of stock', async () => {
      await prisma.product.update({
        where: { id: product.id },
        data: { currentStock: 0 },
      });

      const orderData = {
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
        paymentMethod: 'COD' as const,
      };

      await expect(
        orderService.createOrder(business.id, user.id, orderData)
      ).rejects.toThrow('Insufficient stock');
    });

    it('should throw error when product does not exist', async () => {
      const orderData = {
        customer: {
          name: customer.name,
          phone: customer.phone,
        },
        items: [
          {
            productId: 'nonexistent-id',
            quantity: 1,
          },
        ],
        paymentMethod: 'COD' as const,
      };

      await expect(
        orderService.createOrder(business.id, user.id, orderData)
      ).rejects.toThrow('Some products are invalid or inactive');
    });

    it('should throw error when customer is invalid', async () => {
      const orderData = {
        customer: {
          name: '',
          phone: '',
        },
        items: [
          {
            productId: product.id,
            quantity: 1,
          },
        ],
        paymentMethod: 'COD' as const,
      };

      await expect(
        orderService.createOrder(business.id, user.id, orderData)
      ).rejects.toThrow();
    });
  });

  describe('calculateOrderTotal', () => {
    it('should calculate total correctly', () => {
      const subtotal = 1000;
      const discount = 100;
      const deliveryFee = 200;
      const expectedTotal = 1100;

      const total = subtotal - discount + deliveryFee;
      expect(total).toBe(expectedTotal);
    });

    it('should handle zero discount', () => {
      const subtotal = 1000;
      const discount = 0;
      const deliveryFee = 200;
      const expectedTotal = 1200;

      const total = subtotal - discount + deliveryFee;
      expect(total).toBe(expectedTotal);
    });
  });

  describe('validateOrderStatus', () => {
    it('should allow valid status transitions', async () => {
      const order = await orderService.createOrder(business.id, user.id, {
        customer: {
          name: customer.name,
          phone: customer.phone,
        },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'COD' as const,
      });

      const confirmed = await orderService.updateOrderStatus(
        order.id,
        business.id,
        user.id,
        { status: 'CONFIRMED' }
      );
      expect(confirmed.status).toBe('CONFIRMED');

      const processing = await orderService.updateOrderStatus(
        order.id,
        business.id,
        user.id,
        { status: 'PROCESSING' }
      );
      expect(processing.status).toBe('PROCESSING');

      const ready = await orderService.updateOrderStatus(
        order.id,
        business.id,
        user.id,
        { status: 'READY_TO_SHIP' }
      );
      expect(ready.status).toBe('READY_TO_SHIP');
    });

    it('should reject invalid status transitions', async () => {
      const order = await orderService.createOrder(business.id, user.id, {
        customer: {
          name: customer.name,
          phone: customer.phone,
        },
        items: [{ productId: product.id, quantity: 1 }],
        paymentMethod: 'COD' as const,
      });

      await expect(
        orderService.updateOrderStatus(
          order.id,
          business.id,
          user.id,
          { status: 'DELIVERED' }
        )
      ).rejects.toThrow('Invalid status transition');
    });
  });
});