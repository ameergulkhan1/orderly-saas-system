import { PrismaClient } from '@prisma/client';
// import { HttpError } from '../../lib/httpError';

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // GET DASHBOARD STATS (Multi-tenant)
  // ============================================

  async getStats(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      lowStock,
      todayOrders,
      todayRevenue,
      totalCustomers,
      totalProducts
    ] = await Promise.all([
      // Total orders
      this.prisma.order.count({ where: { businessId } }),
      
      // Total revenue (delivered orders)
      this.prisma.order.aggregate({
        where: { 
          businessId, 
          status: 'DELIVERED' 
        },
        _sum: { total: true }
      }),
      
      // Pending orders
      this.prisma.order.count({
        where: {
          businessId,
          status: { in: ['NEW', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'] }
        }
      }),
      
      // Low stock products
      this.prisma.product.count({
        where: {
          businessId,
          status: 'ACTIVE',
          currentStock: { lte: this.prisma.product.fields.lowStockThreshold }
        }
      }),
      
      // Today's orders
      this.prisma.order.count({
        where: {
          businessId,
          createdAt: { gte: today }
        }
      }),
      
      // Today's revenue
      this.prisma.order.aggregate({
        where: {
          businessId,
          status: 'DELIVERED',
          createdAt: { gte: today }
        },
        _sum: { total: true }
      }),
      
      // Total customers
      this.prisma.customer.count({ where: { businessId } }),
      
      // Total active products
      this.prisma.product.count({ 
        where: { 
          businessId, 
          status: 'ACTIVE' 
        } 
      })
    ]);

    return {
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      pendingOrders,
      lowStock,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalCustomers,
      totalProducts
    };
  }

  // ============================================
  // GET REVENUE CHART DATA (Multi-tenant)
  // ============================================

  async getRevenueChart(businessId: string, period: string = 'week') {
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
        fromDate.setDate(fromDate.getDate() - 7);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        businessId, // ✅ Security: businessId check
        createdAt: { gte: fromDate },
        status: { not: 'CANCELLED' }
      },
      select: {
        createdAt: true,
        total: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const grouped: Record<string, { revenue: number; orders: number; date: Date }> = {};

    orders.forEach((order: { createdAt: string | number | Date; total: any; }) => {
      const date = new Date(order.createdAt);
      const key = date.toISOString().split('T')[0];
      
      if (!grouped[key]) {
        grouped[key] = { revenue: 0, orders: 0, date };
      }
      
      grouped[key].revenue += Number(order.total);
      grouped[key].orders += 1;
    });

    return Object.entries(grouped).map(([key, value]) => ({
      date: key,
      revenue: value.revenue,
      orders: value.orders
    }));
  }

  // ============================================
  // GET ORDER STATUS DISTRIBUTION (Multi-tenant)
  // ============================================

  async getOrderStatusDistribution(businessId: string) {
    const statuses = await this.prisma.order.groupBy({
      by: ['status'],
      where: { businessId }, // ✅ Security: businessId check
      _count: { status: true }
    });

    const total = statuses.reduce((sum: number, s: { _count: { status: number; }; }) => sum + s._count.status, 0);

    return statuses.map((s: { status: any; _count: { status: number; }; }) => ({
      status: s.status,
      count: s._count.status,
      percentage: total > 0 ? (s._count.status / total) * 100 : 0
    }));
  }

  // ============================================
  // GET LOW STOCK ITEMS (Multi-tenant)
  // ============================================

  async getLowStockItems(businessId: string, limit: number = 5) {
    return this.prisma.product.findMany({
      where: {
        businessId, // ✅ Security: businessId check
        status: 'ACTIVE',
        currentStock: { lte: this.prisma.product.fields.lowStockThreshold }
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

  // ============================================
  // GET RECENT ORDERS (Multi-tenant)
  // ============================================

  async getRecentOrders(businessId: string, limit: number = 5) {
    return this.prisma.order.findMany({
      where: { businessId }, // ✅ Security: businessId check
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

  // ============================================
  // GET TODAY'S SUMMARY (Multi-tenant)
  // ============================================

  async getTodaySummary(businessId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenue,
      pendingOrders,
      lowStock
    ] = await Promise.all([
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
          currentStock: { lte: this.prisma.product.fields.lowStockThreshold }
        }
      })
    ]);

    return {
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      pendingOrders,
      lowStock
    };
  }
}
