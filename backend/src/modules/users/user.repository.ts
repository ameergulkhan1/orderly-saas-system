import { PrismaClient } from '@prisma/client';

// Define UserStatus locally
type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findByBusiness(businessId: string, page: number, limit: number, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.role) {
      where.role = filters.role;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async countByBusiness(businessId: string, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.role) {
      where.role = filters.role;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.user.count({ where });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  // ✅ FIX: Use string with type assertion
  async updateStatus(id: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id },
      data: { status: status as any }
    });
  }
}