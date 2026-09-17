import { PrismaClient } from '@prisma/client';

export class OrderRepository {
  constructor(private prisma: PrismaClient) {}

  // ✅ All queries include businessId for security
  async findById(id: string, businessId: string) {
    return this.prisma.order.findFirst({
      where: {
        id,
        businessId  // ✅ CRITICAL: Multi-tenant security
      },
      include: {
        customer: true,
        items: true,
        payments: true,
        delivery: true
      }
    });
  }

  async findByBusiness(businessId: string, page: number, limit: number, filters?: any) {
    const where: any = { businessId }; // ✅ Always filter by businessId

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: any) {
    return this.prisma.order.create({
      data: {
        ...data,
        // businessId must be set from authenticated user
      }
    });
  }

  async update(id: string, businessId: string, data: any) {
    return this.prisma.order.update({
      where: {
        id,
        businessId  // ✅ CRITICAL: Multi-tenant security
      },
      data
    });
  }

  async delete(id: string, businessId: string) {
    return this.prisma.order.delete({
      where: {
        id,
        businessId  // ✅ CRITICAL: Multi-tenant security
      }
    });
  }

  async findByCustomer(customerId: string, businessId: string) {
    return this.prisma.order.findMany({
      where: {
        customerId,
        businessId  // ✅ CRITICAL: Multi-tenant security
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}