import { PrismaClient } from '@prisma/client';
import { ToolContext, ToolResult } from './ai.types';

export class AITools {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // TOOL: getSalesSummary
  // ============================================
  async getSalesSummary(
    ctx: ToolContext,
    period: 'today' | 'yesterday' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ToolResult> {
    try {
      const fromDate = this.getPeriodStart(period);

      const result = await this.prisma.order.aggregate({
        where: {
          businessId: ctx.businessId,
          status: 'DELIVERED',
          createdAt: { gte: fromDate }
        },
        _count: { id: true },
        _sum: { total: true },
        _avg: { total: true }
      });

      return {
        success: true,
        data: {
          period,
          orders: result._count.id,
          revenue: Number(result._sum.total || 0),
          avgOrder: Number(result._avg.total || 0),
          currency: 'PKR'
        }
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  // ============================================
  // TOOL: getTopProducts
  // ============================================
  async getTopProducts(
    ctx: ToolContext,
    options: {
      period?: 'week' | 'month' | 'year';
      limit?: number;
      sortBy?: 'units' | 'revenue';
    } = {}
  ): Promise<ToolResult> {
    try {
      const { period = 'month', limit = 5, sortBy = 'units' } = options;
      const fromDate = this.getPeriodStart(period);

      const items = await this.prisma.orderItem.findMany({
        where: {
          order: {
            businessId: ctx.businessId,
            createdAt: { gte: fromDate },
            status: { not: 'CANCELLED' }
          }
        },
        select: {
          productId: true,
          productName: true,
          quantity: true,
          totalPrice: true
        }
      });

      const map = new Map<string, { name: string; units: number; revenue: number }>();

      for (const item of items) {
        const existing = map.get(item.productId) || {
          name: item.productName,
          units: 0,
          revenue: 0
        };
        existing.units += item.quantity;
        existing.revenue += Number(item.totalPrice);
        map.set(item.productId, existing);
      }

      const sorted = Array.from(map.entries())
        .map(([productId, v]) => ({ productId, ...v }))
        .sort((a, b) =>
          sortBy === 'units' ? b.units - a.units : b.revenue - a.revenue
        )
        .slice(0, limit);

      return {
        success: true,
        data: { period, sortBy, products: sorted }
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  // ============================================
  // TOOL: getLowStockProducts
  // ============================================
  async getLowStockProducts(
    ctx: ToolContext,
    limit: number = 10
  ): Promise<ToolResult> {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          businessId: ctx.businessId,
          status: 'ACTIVE',
          currentStock: {
            lte: this.prisma.product.fields.lowStockThreshold
          }
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

      return {
        success: true,
        data: {
          count: products.length,
          products
        }
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  // ============================================
  // TOOL: getPendingOrders
  // ============================================
  async getPendingOrders(ctx: ToolContext): Promise<ToolResult> {
    try {
      const counts = await this.prisma.order.groupBy({
        by: ['status'],
        where: {
          businessId: ctx.businessId,
          status: {
            in: ['NEW', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP']
          }
        },
        _count: { id: true }
      });

      const total = counts.reduce((sum, c) => sum + c._count.id, 0);

      return {
        success: true,
        data: {
          total,
          byStatus: counts.map(c => ({
            status: c.status,
            count: c._count.id
          }))
        }
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  // ============================================
  // TOOL: getCustomerStats
  // ============================================
  async getCustomerStats(ctx: ToolContext): Promise<ToolResult> {
    try {
      const totalCustomers = await this.prisma.customer.count({
        where: { businessId: ctx.businessId }
      });

      const repeatCustomersRaw = await this.prisma.order.groupBy({
        by: ['customerId'],
        where: { businessId: ctx.businessId },
        _count: { customerId: true },
        having: { customerId: { _count: { gte: 2 } } }
      });

      const repeatCustomers = repeatCustomersRaw.length;

      const topSpendersRaw = await this.prisma.order.groupBy({
        by: ['customerId'],
        where: {
          businessId: ctx.businessId,
          status: { not: 'CANCELLED' }
        },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5
      });

      const customerIds = topSpendersRaw.map(t => t.customerId);
      const customers = await this.prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, phone: true }
      });

      const topSpenders = topSpendersRaw.map(t => {
        const cust = customers.find(c => c.id === t.customerId);
        return {
          name: cust?.name || 'Unknown',
          phone: cust?.phone,
          totalSpent: Number(t._sum.total || 0)
        };
      });

      return {
        success: true,
        data: {
          totalCustomers,
          repeatCustomers,
          topSpenders
        }
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  // ============================================
  // TOOL: getRevenueSummary
  // ============================================
  async getRevenueSummary(ctx: ToolContext): Promise<ToolResult> {
    try {
      const [today, week, month, year] = await Promise.all([
        this.getRevenue(ctx.businessId, 'today'),
        this.getRevenue(ctx.businessId, 'week'),
        this.getRevenue(ctx.businessId, 'month'),
        this.getRevenue(ctx.businessId, 'year')
      ]);

      return {
        success: true,
        data: {
          today,
          week,
          month,
          year,
          currency: 'PKR'
        }
      };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private getPeriodStart(
    period: 'today' | 'yesterday' | 'week' | 'month' | 'year'
  ): Date {
    const now = new Date();

    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());

      case 'yesterday': {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        y.setHours(0, 0, 0, 0);
        return y;
      }

      case 'week': {
        const week = new Date(now);
        week.setDate(week.getDate() - 7);
        return week;
      }

      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);

      case 'year':
        return new Date(now.getFullYear(), 0, 1);
    }
  }

  private async getRevenue(
    businessId: string,
    period: 'today' | 'yesterday' | 'week' | 'month' | 'year'
  ) {
    const from = this.getPeriodStart(period);
    const result = await this.prisma.order.aggregate({
      where: {
        businessId,
        status: 'DELIVERED',
        createdAt: { gte: from }
      },
      _sum: { total: true },
      _count: { id: true }
    });
    return {
      revenue: Number(result._sum.total || 0),
      orders: result._count.id
    };
  }
}