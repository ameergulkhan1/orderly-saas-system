import { PrismaClient } from '@prisma/client';

export class DashboardRepository {
  constructor(private prisma: PrismaClient) {}

  async getStats(businessId: string) {
    const [orders, revenue, pending, lowStock] = await Promise.all([
      this.prisma.order.count({ where: { businessId } }),
      this.prisma.order.aggregate({
        where: { businessId, status: 'DELIVERED' },
        _sum: { total: true }
      }),
      this.prisma.order.count({
        where: {
          businessId,
          status: { in: ['NEW', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'] }
        }
      }),
      this.prisma.product.count({
        where: {
          businessId,
          status: 'ACTIVE',
          currentStock: { lte: 5 }
        }
      })
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, todayRevenue] = await Promise.all([
      this.prisma.order.count({
        where: {
          businessId,
          createdAt: { gte: today }
        }
      }),
      this.prisma.order.aggregate({
        where: {
          businessId,
          status: 'DELIVERED',
          createdAt: { gte: today }
        },
        _sum: { total: true }
      })
    ]);

    return {
      totalOrders: orders,
      totalRevenue: revenue._sum.total || 0,
      pendingOrders: pending,
      lowStock,
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0
    };
  }

  async getRecentOrders(businessId: string, limit: number) {
    return this.prisma.order.findMany({
      where: { businessId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        items: {
          take: 3
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async getRevenueChartData(businessId: string, fromDate: Date) {
    return this.prisma.order.findMany({
      where: {
        businessId,
        createdAt: { gte: fromDate },
        status: { not: 'CANCELLED' }
      },
      select: {
        createdAt: true,
        total: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getLowStockItems(businessId: string, limit: number) {
    return this.prisma.product.findMany({
      where: {
        businessId,
        status: 'ACTIVE',
        currentStock: { lte: 5 }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        lowStockThreshold: true
      },
      orderBy: { currentStock: 'asc' },
      take: limit
    });
  }

  async getOrderStatusDistribution(businessId: string) {
    return this.prisma.order.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { status: true }
    });
  }

  async getQuickStats(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCustomers, totalProducts, todayOrders, pendingOrders, lowStock] = await Promise.all([
      this.prisma.customer.count({ where: { businessId } }),
      this.prisma.product.count({ where: { businessId, status: 'ACTIVE' } }),
      this.prisma.order.count({
        where: {
          businessId,
          createdAt: { gte: today }
        }
      }),
      this.prisma.order.count({
        where: {
          businessId,
          status: { in: ['NEW', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'] }
        }
      }),
      this.prisma.product.count({
        where: {
          businessId,
          status: 'ACTIVE',
          currentStock: { lte: 5 }
        }
      })
    ]);

    return {
      totalCustomers,
      totalProducts,
      todayOrders,
      pendingOrders,
      lowStock
    };
  }
}