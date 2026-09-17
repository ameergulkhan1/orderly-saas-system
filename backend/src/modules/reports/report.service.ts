import { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/httpError';

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  async getRevenueReport(businessId: string, query: { period?: 'day' | 'week' | 'month' | 'year'; from?: string; to?: string }) {
    const { period = 'month', from, to } = query;

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const revenue = await this.prisma.order.findMany({
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

    const grouped = this.groupByPeriod(revenue, period);

    return {
      period,
      from: fromDate,
      to: toDate,
      data: grouped,
      summary: {
        totalRevenue: revenue.reduce((sum: number, r: any) => sum + Number(r.total), 0),
        totalOrders: revenue.length,
        averageOrder: revenue.length > 0 ? revenue.reduce((sum: number, r: { total: any; }) => sum + Number(r.total), 0) / revenue.length : 0
      }
    };
  }

  async getOrdersReport(businessId: string, query: { period?: 'day' | 'week' | 'month' | 'year'; from?: string; to?: string }) {
    const { period = 'month', from, to } = query;

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const orders = await this.prisma.order.findMany({
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

    const grouped = this.groupByPeriod(orders, period);

    const statusCount = orders.reduce((acc: Record<string, number>, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period,
      from: fromDate,
      to: toDate,
      data: grouped,
      summary: {
        totalOrders: orders.length,
        byStatus: statusCount,
        totalRevenue: orders.reduce((sum: number, o: any) => sum + Number(o.total), 0)
      }
    };
  }

  async getProductsReport(businessId: string, query: { period?: string; from?: string; to?: string }) {
    const { period = 'month', from, to } = query;

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const products = await this.prisma.orderItem.findMany({
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

    // Fix: Properly type the accumulator
    const productStats = products.reduce((acc: any, item: any) => {
      const key = item.productId;
      if (!acc[key]) {
        acc[key] = {
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          totalSold: 0,
          totalRevenue: 0,
          orders: new Set()
        };
      }
      acc[key].totalSold += item.quantity;
      acc[key].totalRevenue += Number(item.totalPrice);
      acc[key].orders.add(item.orderId);
      return acc;
    }, {} as Record<string, any>);

    const result = Object.values(productStats).map((p: any) => ({
      ...p,
      orders: p.orders.size
    }));

    return {
      period,
      from: fromDate,
      to: toDate,
      data: result.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue),
      summary: {
        totalProducts: result.length,
        totalSold: result.reduce((sum: number, p: any) => sum + p.totalSold, 0),
        totalRevenue: result.reduce((sum: number, p: any) => sum + p.totalRevenue, 0)
      }
    };
  }

  async getCustomersReport(businessId: string, query: { period?: string; from?: string; to?: string }) {
    const { period = 'month', from, to } = query;

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const customers = await this.prisma.customer.findMany({
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
          }
        }
      }
    });

    const result = customers.map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      totalOrders: customer.orders.length,
      totalSpent: customer.orders.reduce((sum: number, o: any) => sum + Number(o.total), 0),
      averageOrder: customer.orders.length > 0 
        ? customer.orders.reduce((sum: number, o: any) => sum + Number(o.total), 0) / customer.orders.length 
        : 0
    }));

    return {
      period,
      from: fromDate,
      to: toDate,
      data: result.sort((a: any, b: any) => b.totalSpent - a.totalSpent),
      summary: {
        totalCustomers: result.length,
        totalOrders: result.reduce((sum: number, c: any) => sum + c.totalOrders, 0),
        totalRevenue: result.reduce((sum: number, c: any) => sum + c.totalSpent, 0)
      }
    };
  }

  async getTopProducts(businessId: string, limit: number = 10, period: string = 'month') {
    const fromDate = new Date();
    switch (period) {
      case 'week':
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case 'month':
        fromDate.setMonth(fromDate.getMonth() - 1);
        break;
      case 'year':
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        break;
      default:
        fromDate.setMonth(fromDate.getMonth() - 1);
    }

    const products = await this.prisma.orderItem.findMany({
      where: {
        order: {
          businessId,
          createdAt: { gte: fromDate },
          status: { not: 'CANCELLED' }
        }
      },
      include: {
        product: true
      }
    });

    const stats = products.reduce((acc: any, item: any) => {
      const key = item.productId;
      if (!acc[key]) {
        acc[key] = {
          name: item.productName,
          sku: item.sku,
          sales: 0,
          revenue: 0
        };
      }
      acc[key].sales += item.quantity;
      acc[key].revenue += Number(item.totalPrice);
      return acc;
    }, {} as Record<string, any>);

    const result = Object.values(stats).sort((a: any, b: any) => b.sales - a.sales).slice(0, limit);

    return result;
  }

  async getTopCustomers(businessId: string, limit: number = 10, period: string = 'month') {
    const fromDate = new Date();
    switch (period) {
      case 'week':
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case 'month':
        fromDate.setMonth(fromDate.getMonth() - 1);
        break;
      case 'year':
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        break;
      default:
        fromDate.setMonth(fromDate.getMonth() - 1);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        businessId,
        createdAt: { gte: fromDate },
        status: { not: 'CANCELLED' }
      },
      include: {
        customer: true
      }
    });

    const stats = orders.reduce((acc: any, order: any) => {
      const key = order.customerId;
      if (!acc[key]) {
        acc[key] = {
          name: order.customerName,
          phone: order.customerPhone,
          customerId: order.customerId,
          orders: 0,
          spent: 0
        };
      }
      acc[key].orders += 1;
      acc[key].spent += Number(order.total);
      return acc;
    }, {} as Record<string, any>);

    const result = Object.values(stats).sort((a: any, b: any) => b.spent - a.spent).slice(0, limit);

    return result;
  }

  async getOrderStatusReport(businessId: string) {
    const statuses = await this.prisma.order.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { status: true }
    });

    const total = statuses.reduce((sum: number, s: any) => sum + s._count.status, 0);

    return statuses.map((s: any) => ({
      status: s.status,
      count: s._count.status,
      percentage: total > 0 ? (s._count.status / total) * 100 : 0
    }));
  }

  async getDashboardReport(businessId: string) {
    const [orders, revenue, products, customers] = await Promise.all([
      this.prisma.order.count({ where: { businessId } }),
      this.prisma.order.aggregate({
        where: { businessId, status: 'DELIVERED' },
        _sum: { total: true }
      }),
      this.prisma.product.count({ where: { businessId } }),
      this.prisma.customer.count({ where: { businessId } })
    ]);

    const [pendingOrders, lowStock] = await Promise.all([
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

    const recentOrders = await this.prisma.order.findMany({
      where: { businessId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });

    return {
      totalOrders: orders,
      totalRevenue: revenue._sum.total || 0,
      totalProducts: products,
      totalCustomers: customers,
      pendingOrders,
      lowStock,
      recentOrders
    };
  }

  private groupByPeriod(data: any[], period: string) {
    const grouped: Record<string, any[]> = {};

    data.forEach(item => {
      let key: string;
      const date = new Date(item.createdAt);

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekNumber = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = `${date.getFullYear()}`;
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return Object.entries(grouped).map(([key, items]) => ({
      period: key,
      count: items.length,
      total: items.reduce((sum: number, i: any) => sum + Number(i.total || 0), 0)
    }));
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }
}
