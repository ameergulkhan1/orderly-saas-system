import { PrismaClient } from "@prisma/client";
import { HttpError } from "../../lib/httpError";

export class CustomerService {
  constructor(private prisma: PrismaClient) {}

  async createCustomer(
    businessId: string,
    data: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
      city?: string;
      notes?: string;
    }
  ) {
    const existing = await this.prisma.customer.findFirst({
      where: { businessId, phone: data.phone },
    });

    if (existing) return existing;

    return this.prisma.customer.create({
      data: { ...data, businessId },
    });
  }

  async getCustomers(
    businessId: string,
    query: { search?: string; status?: string; page?: number; limit?: number }
  ) {
    const { search, status, page = 1, limit = 20 } = query;

    const where: any = { businessId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          _count: { select: { orders: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const customerIds = customers.map((c) => c.id);

    // Sum PAID payments per customer via their orders
    const paidByOrder = customerIds.length
      ? await this.prisma.payment.groupBy({
          by: ["orderId"],
          where: {
            businessId,
            status: "PAID",
            order: { customerId: { in: customerIds } },
          },
          _sum: { amount: true },
        })
      : [];

    const orderIds = paidByOrder.map((p) => p.orderId);

    const orders = orderIds.length
      ? await this.prisma.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, customerId: true },
        })
      : [];

    const orderToCustomer = new Map(orders.map((o) => [o.id, o.customerId]));

    const spentByCustomer: Record<string, number> = {};
    for (const p of paidByOrder) {
      const customerId = orderToCustomer.get(p.orderId);
      if (!customerId) continue;
      spentByCustomer[customerId] =
        (spentByCustomer[customerId] ?? 0) + Number(p._sum.amount ?? 0);
    }

    const data = customers.map((c) => ({
      ...c,
      totalOrders: c._count.orders,
      totalSpent: spentByCustomer[c.id] ?? 0,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(id: string, businessId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new HttpError(404, "Customer not found");
    }

    // Order-based stats: total billed, average per order
    const orderStats = await this.prisma.order.aggregate({
      where: { businessId, customerId: id },
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
    });

    // Payment-based stats: total actually paid
    const paidAgg = await this.prisma.payment.aggregate({
      where: {
        businessId,
        status: "PAID",
        order: { customerId: id },
      },
      _sum: { amount: true },
    });

    const totalOrders = orderStats._count.id || 0;
    const totalSpent = Number(paidAgg._sum.amount ?? 0);
    const totalBilled = Number(orderStats._sum.total ?? 0);
    const averageOrder =
      totalOrders > 0 ? Number(orderStats._sum.total ?? 0) / totalOrders : 0;

    return {
      ...customer,
      stats: {
        totalOrders,
        totalSpent,       // what they actually paid
        totalBilled,      // what they were invoiced for
        averageOrder,     // average invoice amount
        outstanding: Math.max(totalBilled - totalSpent, 0),
      },
    };
  }

  async updateCustomer(id: string, businessId: string, data: any) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
    });

    if (!customer) {
      throw new HttpError(404, "Customer not found");
    }

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async deleteCustomer(id: string, businessId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
    });

    if (!customer) {
      throw new HttpError(404, "Customer not found");
    }

    return this.prisma.customer.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  }

  async getCustomerOrders(
    id: string,
    businessId: string,
    page: number,
    limit: number
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
    });

    if (!customer) {
      throw new HttpError(404, "Customer not found");
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { businessId, customerId: id },
        include: {
          items: true,
          payments: true,
          delivery: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({ where: { businessId, customerId: id } }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}