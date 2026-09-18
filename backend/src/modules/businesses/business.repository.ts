import { PrismaClient } from '@prisma/client';
import type { UserRole } from '@prisma/client';

export class BusinessRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        }
      }
    });
  }

  async findByOwnerId(ownerId: string) {
    return this.prisma.business.findFirst({
      where: { ownerId }
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.business.findMany({
      where: {
        users: {
          some: { id: userId }
        }
      }
    });
  }

  async create(data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    ownerId: string;
  }) {
    return this.prisma.business.create({
      data
    });
  }

  async update(id: string, data: any) {
    return this.prisma.business.update({
      where: { id },
      data
    });
  }

  async getUserInBusiness(
    userId: string,
    businessId: string
  ) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        businessId
      }
    });
  }

  async updateUserRole(
    userId: string,
    role: UserRole
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role
      }
    });
  }

  async removeUserFromBusiness(userId: string) {
    // businessId is required in the Prisma schema,
    // so the user cannot be disconnected by setting it to null.
    // Use a suspended status instead.
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED'
      }
    });
  }

  async getBusinessStats(businessId: string) {
    const [customers, products, orders] = await Promise.all([
      this.prisma.customer.count({
        where: { businessId }
      }),
      this.prisma.product.count({
        where: { businessId }
      }),
      this.prisma.order.count({
        where: { businessId }
      })
    ]);

    return {
      customers,
      products,
      orders
    };
  }
}