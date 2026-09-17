import { PrismaClient } from '@prisma/client';

export class DeliveryRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: true
          }
        }
      }
    });
  }

  async findByOrder(orderId: string) {
    return this.prisma.delivery.findFirst({
      where: { orderId }
    });
  }

  async findByBusiness(businessId: string, page: number, limit: number, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    return this.prisma.delivery.findMany({
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
    });
  }

  async countByBusiness(businessId: string, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }

    return this.prisma.delivery.count({ where });
  }

  async create(data: any) {
    return this.prisma.delivery.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.delivery.update({
      where: { id },
      data
    });
  }

  async updateStatus(id: string, status: string, additionalData?: any) {
    return this.prisma.delivery.update({
      where: { id },
      data: { status, ...additionalData }
    });
  }

  async updateTracking(id: string, trackingNumber: string, courier: string) {
    return this.prisma.delivery.update({
      where: { id },
      data: { trackingNumber, courier }
    });
  }

  async getStatusCounts(businessId: string) {
    return this.prisma.delivery.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { status: true }
    });
  }

  async getPendingDeliveries(businessId: string) {
    return this.prisma.delivery.findMany({
      where: {
        businessId,
        status: { in: ['PENDING', 'READY_TO_SHIP', 'SHIPPED'] }
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            customerPhone: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}