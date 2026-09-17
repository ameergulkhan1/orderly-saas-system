import { PrismaClient } from '@prisma/client';

export class ReportRepository {
  constructor(private prisma: PrismaClient) {}

  async getRevenueData(businessId: string, fromDate: Date, toDate: Date) {
    return this.prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: fromDate,
          lte: toDate
        },
        status: 'DELIVERED'
      },
      select: {
        createdAt: true,
        total: true,
        subtotal: true,
        deliveryFee: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getOrdersData(businessId: string, fromDate: Date, toDate: Date) {
    return this.prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      select: {
        createdAt: true,
        status: true,
        total: true,
        paymentStatus: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getProductsData(businessId: string, fromDate: Date, toDate: Date) {
    return this.prisma.orderItem.findMany({
      where: {
        order: {
          businessId,
          createdAt: {
            gte: fromDate,
            lte: toDate
          },
          status: { not: 'CANCELLED' }
        }
      },
      include: {
        product: true
      }
    });
  }

  async getCustomersData(businessId: string, fromDate: Date, toDate: Date) {
    return this.prisma.customer.findMany({
      where: {
        businessId,
        orders: {
          some: {
            createdAt: {
              gte: fromDate,
              lte: toDate
            }
          }
        }
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: fromDate,
              lte: toDate
            },
            status: { not: 'CANCELLED' }
          },
          select: {
            total: true,
            status: true
          }
        }
      }
    });
  }

  async getOrderStatusStats(businessId: string) {
    return this.prisma.order.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { status: true }
    });
  }

  async getDashboardStats(businessId: string) {
    const [orders, revenue, products, customers] = await Promise.all([
      this.prisma.order.count({ where: { businessId } }),
      this.prisma.order.aggregate({
        where: { businessId, status: 'DELIVERED' },
        _sum: { total: true }
      }),
      this.prisma.product.count({ where: { businessId } }),
      this.prisma.customer.count({ where: { businessId } })
    ]);

    const [pendingOrders, lowStock, todayOrders] = await Promise.all([
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
      }),
      this.prisma.order.count({
        where: {
          businessId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    return {
      totalOrders: orders,
      totalRevenue: revenue._sum.total || 0,
      totalProducts: products,
      totalCustomers: customers,
      pendingOrders,
      lowStock,
      todayOrders
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

  async getTopProducts(businessId: string, fromDate: Date, toDate: Date, limit: number) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          businessId,
          createdAt: {
            gte: fromDate,
            lte: toDate
          },
          status: { not: 'CANCELLED' }
        }
      },
      include: {
        product: true
      }
    });

    return orderItems;
  }

  async getTopCustomers(businessId: string, fromDate: Date, toDate: Date, limit: number) {
    return this.prisma.order.findMany({
      where: {
        businessId,
        createdAt: {
          gte: fromDate,
          lte: toDate
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        customer: true
      },
      orderBy: { total: 'desc' },
      take: limit
    });
  }
}