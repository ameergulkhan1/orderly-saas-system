import { PrismaClient } from '@prisma/client';

export class CustomerRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id }
    });
  }

  async findByPhone(businessId: string, phone: string) {
    return this.prisma.customer.findFirst({
      where: {
        businessId,
        phone
      }
    });
  }

  async findByBusiness(businessId: string, page: number, limit: number, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { orders: true }
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
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.customer.count({ where });
  }

  async create(data: any) {
    return this.prisma.customer.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.customer.update({
      where: { id },
      data
    });
  }

  async archive(id: string) {
    return this.prisma.customer.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
  }

  async getCustomerStats(customerId: string) {
    return this.prisma.order.aggregate({
      where: { customerId },
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true }
    });
  }

  async getCustomerOrders(customerId: string, page: number, limit: number) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        items: true,
        payments: true,
        delivery: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async countCustomerOrders(customerId: string) {
    return this.prisma.order.count({
      where: { customerId }
    });
  }
}