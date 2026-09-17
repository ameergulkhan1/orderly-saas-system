import { PrismaClient } from '@prisma/client';

export class PaymentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.payment.findUnique({
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
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByBusiness(businessId: string, page: number, limit: number, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            customerName: true,
            total: true
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
    
    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.payment.count({ where });
  }

  async create(data: any) {
    return this.prisma.payment.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.payment.update({
      where: { id },
      data
    });
  }

  async getTotalPaidForOrder(orderId: string) {
    return this.prisma.payment.aggregate({
      where: {
        orderId,
        status: 'PAID'
      },
      _sum: { amount: true }
    });
  }

  async getPaymentSummary(businessId: string) {
    const [totalReceived, totalPending, totalCOD, totalFailed] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { businessId, status: 'PAID' },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { businessId, status: 'PENDING' },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { businessId, method: 'COD' },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { businessId, status: 'FAILED' },
        _sum: { amount: true }
      })
    ]);

    return {
      totalReceived: totalReceived._sum.amount || 0,
      totalPending: totalPending._sum.amount || 0,
      totalCOD: totalCOD._sum.amount || 0,
      totalFailed: totalFailed._sum.amount || 0
    };
  }

  async getMethodBreakdown(businessId: string) {
    return this.prisma.payment.groupBy({
      by: ['method'],
      where: { businessId },
      _sum: { amount: true },
      _count: { method: true }
    });
  }
}