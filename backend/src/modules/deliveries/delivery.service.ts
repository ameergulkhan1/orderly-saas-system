import { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/httpError';

// Define types locally instead of importing from @prisma/client
type DeliveryStatus = 'PENDING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'FAILED' | 'RETURNED';
type OrderStatus = 'NEW' | 'CONFIRMED' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED_DELIVERY' | 'RETURNED';

// Status transition rules for deliveries
const DELIVERY_STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING: ['READY_TO_SHIP'],
  READY_TO_SHIP: ['SHIPPED'],
  SHIPPED: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: ['RETURNED'],
  RETURNED: []
};

// Map delivery status to order status
const ORDER_STATUS_MAP: Record<DeliveryStatus, OrderStatus | null> = {
  PENDING: null,
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED_DELIVERY',
  RETURNED: 'RETURNED'
};

export class DeliveryService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // CREATE DELIVERY (Multi-tenant)
  // ============================================

  async createDelivery(businessId: string, data: { 
    orderId: string; 
    courier?: string; 
    trackingNumber?: string; 
    deliveryFee?: number; 
    notes?: string 
  }) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: data.orderId,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    const existing = await this.prisma.delivery.findFirst({
      where: {
        orderId: data.orderId,
        businessId
      }
    });

    if (existing) {
      throw new HttpError(409, 'Delivery already exists for this order');
    }

    return this.prisma.delivery.create({
      data: {
        businessId,
        orderId: data.orderId,
        courier: data.courier,
        trackingNumber: data.trackingNumber,
        deliveryFee: data.deliveryFee || 0,
        status: 'PENDING',
        notes: data.notes
      }
    });
  }

  // ============================================
  // GET DELIVERIES (Multi-tenant)
  // ============================================

  async getDeliveries(businessId: string, query: { 
    status?: string; 
    orderId?: string; 
    search?: string;
    page?: number; 
    limit?: number 
  }) {
    const { status, orderId, search, page = 1, limit = 20 } = query;

    const where: any = { businessId };

    if (status) {
      where.status = status;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (search) {
      where.OR = [
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { courier: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              customerName: true,
              customerPhone: true,
              deliveryAddress: true,
              deliveryCity: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.delivery.count({ where })
    ]);

    return {
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ============================================
  // GET DELIVERY BY ID (Multi-tenant)
  // ============================================

  async getDeliveryById(id: string, businessId: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id,
        businessId
      },
      include: {
        order: {
          include: {
            customer: true,
            items: true
          }
        }
      }
    });

    if (!delivery) {
      throw new HttpError(404, 'Delivery not found');
    }

    return delivery;
  }

  // ============================================
  // GET DELIVERY BY ORDER (Multi-tenant)
  // ============================================

  async getDeliveryByOrder(orderId: string, businessId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    const delivery = await this.prisma.delivery.findFirst({
      where: {
        orderId,
        businessId
      },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!delivery) {
      throw new HttpError(404, 'Delivery not found for this order');
    }

    return delivery;
  }

  // ============================================
  // UPDATE DELIVERY (Multi-tenant)
  // ============================================

  async updateDelivery(id: string, businessId: string, data: { 
    courier?: string; 
    trackingNumber?: string; 
    notes?: string 
  }) {
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!delivery) {
      throw new HttpError(404, 'Delivery not found');
    }

    return this.prisma.delivery.update({
      where: { id },
      data
    });
  }

  // ============================================
  // UPDATE DELIVERY STATUS (With Validation)
  // ============================================

  async updateDeliveryStatus(id: string, businessId: string, data: { status: DeliveryStatus }) {
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id,
        businessId
      },
      include: {
        order: true
      }
    });

    if (!delivery) {
      throw new HttpError(404, 'Delivery not found');
    }

    // Validate status transition
    const allowedTransitions = DELIVERY_STATUS_TRANSITIONS[delivery.status as DeliveryStatus];
    if (!allowedTransitions.includes(data.status)) {
      throw new HttpError(
        400,
        `Invalid status transition from ${delivery.status} to ${data.status}. ` +
        `Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }

    const updateData: any = { status: data.status };

    switch (data.status) {
      case 'SHIPPED':
        updateData.shippedAt = new Date();
        break;
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        break;
      case 'FAILED':
        updateData.failedAt = new Date();
        break;
      case 'RETURNED':
        updateData.returnedAt = new Date();
        break;
    }

    // Update order status
    const orderStatus = ORDER_STATUS_MAP[data.status];
    if (orderStatus) {
      const orderUpdateData: any = { status: orderStatus };
      
      switch (data.status) {
        case 'SHIPPED':
          orderUpdateData.shippedAt = new Date();
          break;
        case 'DELIVERED':
          orderUpdateData.deliveredAt = new Date();
          break;
      }

      await this.prisma.order.update({
        where: { id: delivery.orderId },
        data: orderUpdateData
      });
    }

    return this.prisma.delivery.update({
      where: { id },
      data: updateData
    });
  }

  // ============================================
  // UPDATE TRACKING (Multi-tenant)
  // ============================================

  async updateTracking(id: string, businessId: string, trackingNumber: string, courier: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!delivery) {
      throw new HttpError(404, 'Delivery not found');
    }

    return this.prisma.delivery.update({
      where: { id },
      data: { trackingNumber, courier }
    });
  }

  // ============================================
  // GET DELIVERY STATUS SUMMARY (Multi-tenant)
  // ============================================

  async getDeliveryStatusSummary(businessId: string) {
    const statuses = await this.prisma.delivery.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { status: true }
    });

    const total = statuses.reduce((sum: any, s: { _count: { status: any; }; }) => sum + s._count.status, 0);

    return statuses.map((s: { status: any; _count: { status: number; }; }) => ({
      status: s.status,
      count: s._count.status,
      percentage: total > 0 ? (s._count.status / total) * 100 : 0
    }));
  }
}
