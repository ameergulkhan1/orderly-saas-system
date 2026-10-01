// src/modules/ai/ai.service.ts

import { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/httpError';

type ChatIntent =
  | 'getTopProducts'
  | 'getBestSellers'
  | 'getSalesSummary'
  | 'getLowStock'
  | 'getPendingOrders'
  | 'getCustomerStats'
  | 'getRevenue'
  | 'getProductStats'
  | 'getOrderStats'
  | 'getAllCustomers'
  | 'help';

interface ChatResult {
  message: string;
  intent: ChatIntent;
  toolUsed: string;
  data?: unknown;
}

export class AIService {
  constructor(private prisma: PrismaClient) {}

  async chat(businessId: string, message: string): Promise<ChatResult> {
    const text = message.trim();
    if (!text) {
      throw new HttpError(400, 'Message is required', 'EMPTY_MESSAGE');
    }

    const intent = this.detectIntent(text);

    switch (intent) {
      case 'getProductStats':
        return this.getProductStats(businessId);
      case 'getOrderStats':
        return this.getOrderStats(businessId);
      case 'getAllCustomers':
        return this.getAllCustomers(businessId);
      case 'getBestSellers':
        return this.getBestSellers(businessId);
      case 'getLowStock':
        return this.getLowStock(businessId);
      case 'getPendingOrders':
        return this.getPendingOrders(businessId);
      case 'getCustomerStats':
        return this.getCustomerStats(businessId);
      case 'getRevenue':
        return this.getRevenue(businessId);
      case 'getSalesSummary':
        return this.getSalesSummary(businessId);
      case 'getTopProducts':
        return this.getTopProducts(businessId);
      default:
        return this.help();
    }
  }

  // ============================================
  // INTENT DETECTION
  // ============================================

  private detectIntent(text: string): ChatIntent {
    const t = text.toLowerCase();

    // Product-related
    if (/\b(how many|count|total|number of)\b.*\bproducts?\b/.test(t)) {
      return 'getProductStats';
    }
    if (/\b(list|show|view|all)\b.*\bproducts?\b/.test(t)) {
      return 'getProductStats';
    }
    if (/\b(products?)\b.*\b(stock|inventory|quantity)\b/.test(t)) {
      return 'getProductStats';
    }

    // Orders-related
    if (/\b(how many|count|total|number of)\b.*\borders?\b/.test(t)) {
      return 'getOrderStats';
    }
    if (/\b(list|show|view|all)\b.*\borders?\b/.test(t)) {
      return 'getOrderStats';
    }
    if (/\bpending\b.*\borders?\b/.test(t)) {
      return 'getPendingOrders';
    }

    // Customers-related
    if (/\b(how many|count|total|number of)\b.*\bcustomers?\b/.test(t)) {
      return 'getCustomerStats';
    }
    if (/\b(list|show|view|all)\b.*\bcustomers?\b/.test(t)) {
      return 'getAllCustomers';
    }

    // Best sellers — this also mentions "products" so must come AFTER getProductStats check
    if (/\b(best|top|most)\b.*\b(sell|selling|sold)\b/.test(t)) {
      return 'getBestSellers';
    }
    if (/\b(top|best)\b.*\bproducts?\b/.test(t)) {
      return 'getBestSellers';
    }

    // Restocking
    if (/\b(low|restock|running out|need.*stock|out of stock)\b/.test(t)) {
      return 'getLowStock';
    }

    // Revenue
    if (/\b(revenue|income|earnings|sales)\b/.test(t)) {
      if (/\b(today|yesterday|week|month|year)\b/.test(t)) {
        return 'getRevenue';
      }
      return 'getSalesSummary';
    }

    return 'help';
  }

  // ============================================
  // PRODUCT TOOLS
  // ============================================

  private async getProductStats(businessId: string): Promise<ChatResult> {
    const products = await this.prisma.product.findMany({
      where: { businessId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        currentStock: true,
        lowStockThreshold: true,
      },
      orderBy: { currentStock: 'desc' },
    });

    const total = products.length;
    const lowStock = products.filter(
      (p) => p.currentStock > 0 && p.currentStock <= p.lowStockThreshold
    ).length;
    const outOfStock = products.filter((p) => p.currentStock === 0).length;
    const inStock = total - lowStock - outOfStock;

    const preview = products.slice(0, 10).map((p) => ({
      name: p.name,
      stock: p.currentStock,
      price: Number(p.price),
    }));

    return {
      message:
        total === 0
          ? 'You have no products yet.'
          : `You have ${total} products. ${inStock} in stock, ${lowStock} low, ${outOfStock} out of stock.`,
      intent: 'getProductStats',
      toolUsed: 'getProductStats',
      data: { total, inStock, lowStock, outOfStock, products: preview },
    };
  }

  private async getLowStock(businessId: string): Promise<ChatResult> {
    const products = await this.prisma.product.findMany({
      where: { businessId, status: 'ACTIVE' },
      select: {
        name: true,
        sku: true,
        currentStock: true,
        lowStockThreshold: true,
      },
    });

    const items = products.filter(
      (p) => p.currentStock <= p.lowStockThreshold
    );

    return {
      message:
        items.length === 0
          ? 'All products are well stocked.'
          : `${items.length} product(s) need restocking: ${items
              .slice(0, 5)
              .map((p) => `${p.name} (${p.currentStock} left)`)
              .join(', ')}.`,
      intent: 'getLowStock',
      toolUsed: 'getLowStock',
      data: { items },
    };
  }

  // ============================================
  // ORDER TOOLS
  // ============================================

  private async getOrderStats(businessId: string): Promise<ChatResult> {
    const [total, byStatus, recentOrders] = await Promise.all([
      this.prisma.order.count({ where: { businessId } }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { businessId },
        _count: { id: true },
      }),
      this.prisma.order.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) {
      statusMap[row.status] = row._count.id;
    }

    const pending =
      (statusMap['NEW'] ?? 0) +
      (statusMap['CONFIRMED'] ?? 0) +
      (statusMap['PROCESSING'] ?? 0) +
      (statusMap['READY_TO_SHIP'] ?? 0);

    return {
      message:
        total === 0
          ? 'You have no orders yet.'
          : `You have ${total} orders total — ${pending} pending, ${
              statusMap['SHIPPED'] ?? 0
            } shipped, ${statusMap['DELIVERED'] ?? 0} delivered.`,
      intent: 'getOrderStats',
      toolUsed: 'getOrderStats',
      data: {
        total,
        byStatus: statusMap,
        pending,
        recentOrders: recentOrders.map((o) => ({
          orderNumber: o.orderNumber,
          customer: o.customerName,
          status: o.status,
          total: Number(o.total),
          date: o.createdAt,
        })),
      },
    };
  }

  private async getPendingOrders(businessId: string): Promise<ChatResult> {
    const orders = await this.prisma.order.findMany({
      where: {
        businessId,
        status: { in: ['NEW', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'] },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        orderNumber: true,
        customerName: true,
        status: true,
        total: true,
      },
    });

    return {
      message:
        orders.length === 0
          ? 'You have no pending orders.'
          : `You have ${orders.length} pending orders.`,
      intent: 'getPendingOrders',
      toolUsed: 'getPendingOrders',
      data: { orders },
    };
  }

  // ============================================
  // CUSTOMER TOOLS
  // ============================================

  private async getCustomerStats(businessId: string): Promise<ChatResult> {
    const [total, recent] = await Promise.all([
      this.prisma.customer.count({ where: { businessId } }),
      this.prisma.customer.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);

    return {
      message:
        total === 0
          ? 'You have no customers yet.'
          : `You have ${total} customers in total.`,
      intent: 'getCustomerStats',
      toolUsed: 'getCustomerStats',
      data: {
        total,
        customers: recent.map((c) => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          orders: c._count.orders,
        })),
      },
    };
  }

  private async getAllCustomers(businessId: string): Promise<ChatResult> {
    const customers = await this.prisma.customer.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        name: true,
        phone: true,
        email: true,
        _count: { select: { orders: true } },
      },
    });

    return {
      message:
        customers.length === 0
          ? 'You have no customers yet.'
          : `Here are your ${customers.length} customers: ${customers
              .slice(0, 5)
              .map((c) => c.name)
              .join(', ')}${customers.length > 5 ? '…' : ''}`,
      intent: 'getAllCustomers',
      toolUsed: 'getAllCustomers',
      data: { customers },
    };
  }

  // ============================================
  // BEST SELLERS (products + their stock)
  // ============================================

  private async getBestSellers(businessId: string): Promise<ChatResult> {
    // Aggregate order items across delivered orders, join product for stock
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          businessId,
          status: { in: ['DELIVERED', 'SHIPPED'] },
        },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    if (grouped.length === 0) {
      return {
        message:
          'No sales recorded yet. Best sellers will appear once orders are delivered.',
        intent: 'getBestSellers',
        toolUsed: 'getBestSellers',
        data: { products: [] },
      };
    }

    const productIds = grouped.map((g) => g.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        currentStock: true,
        lowStockThreshold: true,
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = grouped.map((g) => {
      const p = productMap.get(g.productId);
      return {
        name: p?.name ?? 'Unknown',
        unitsSold: g._sum.quantity ?? 0,
        revenue: Number(g._sum.totalPrice ?? 0),
        currentStock: p?.currentStock ?? 0,
        lowStockThreshold: p?.lowStockThreshold ?? 5,
      };
    });

    const top = items[0];
    return {
      message: `Your best seller is ${top.name} with ${top.unitsSold} units sold and ${top.currentStock} left in stock.`,
      intent: 'getBestSellers',
      toolUsed: 'getBestSellers',
      data: { products: items },
    };
  }

  private async getTopProducts(businessId: string): Promise<ChatResult> {
    // Same as getBestSellers but only counts DELIVERED orders and units
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          businessId,
          status: 'DELIVERED',
        },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    if (grouped.length === 0) {
      return {
        message: 'No product sales recorded for this period.',
        intent: 'getTopProducts',
        toolUsed: 'getTopProducts',
        data: { products: [] },
      };
    }

    const ids = grouped.map((g) => g.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, currentStock: true },
    });
    const map = new Map(products.map((p) => [p.id, p]));

    const items = grouped.map((g) => ({
      name: map.get(g.productId)?.name ?? 'Unknown',
      unitsSold: g._sum.quantity ?? 0,
      revenue: Number(g._sum.totalPrice ?? 0),
      currentStock: map.get(g.productId)?.currentStock ?? 0,
    }));

    return {
      message: `Top product: ${items[0].name} (${items[0].unitsSold} units).`,
      intent: 'getTopProducts',
      toolUsed: 'getTopProducts',
      data: { products: items },
    };
  }

  // ============================================
  // REVENUE
  // ============================================

  private async getRevenue(businessId: string): Promise<ChatResult> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result = await this.prisma.order.aggregate({
      where: {
        businessId,
        status: { in: ['DELIVERED', 'SHIPPED'] },
        createdAt: { gte: startOfDay },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    const revenue = Number(result._sum.total ?? 0);
    const orders = result._count.id;

    return {
      message: `Today's revenue is Rs. ${revenue.toLocaleString()} across ${orders} orders.`,
      intent: 'getRevenue',
      toolUsed: 'getRevenue',
      data: { revenue, orders, period: 'today' },
    };
  }

  private async getSalesSummary(businessId: string): Promise<ChatResult> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await this.prisma.order.aggregate({
      where: {
        businessId,
        status: { in: ['DELIVERED', 'SHIPPED'] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
      _count: { id: true },
      _avg: { total: true },
    });

    const revenue = Number(result._sum.total ?? 0);
    const orders = result._count.id;
    const avg = Number(result._avg.total ?? 0);

    return {
      message: `This month you sold Rs. ${revenue.toLocaleString()} across ${orders} orders (avg Rs. ${Math.round(
        avg
      ).toLocaleString()}).`,
      intent: 'getSalesSummary',
      toolUsed: 'getSalesSummary',
      data: { revenue, orders, averageOrder: avg, period: 'month' },
    };
  }

  // ============================================
  // FALLBACK
  // ============================================

  private help(): ChatResult {
    return {
      message: [
        'I can help you with:',
        '• Product count — "How many products do I have?"',
        '• All orders — "How many orders do I have?"',
        '• All customers — "How many customers do I have?"',
        '• Best sellers — "What are my best selling products?"',
        '• Low stock — "What needs restocking?"',
        '• Pending orders — "How many orders are pending?"',
        '• Revenue — "Show me today\'s revenue"',
      ].join('\n'),
      intent: 'help',
      toolUsed: 'getHelp',
    };
  }
}