import { PrismaClient } from '@prisma/client';

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id }
    });
  }

  async findBySku(businessId: string, sku: string) {
    return this.prisma.product.findFirst({
      where: {
        businessId,
        sku
      }
    });
  }

  async findByBusiness(businessId: string, page: number, limit: number, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.category) {
      where.category = filters.category;
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        _count: {
          select: { orderItems: true }
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
    
    if (filters?.category) {
      where.category = filters.category;
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.product.count({ where });
  }

  async create(data: any) {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data
    });
  }

  async archive(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
  }

  async findLowStock(businessId: string, threshold?: number) {
    return this.prisma.product.findMany({
      where: {
        businessId,
        status: 'ACTIVE',
        currentStock: {
          lte: threshold || 5
        }
      },
      orderBy: { currentStock: 'asc' }
    });
  }

  async updateStock(productId: string, newStock: number) {
    return this.prisma.product.update({
      where: { id: productId },
      data: { currentStock: newStock }
    });
  }

  async decrementStock(productId: string, quantity: number) {
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: {
          decrement: quantity
        }
      }
    });
  }

  async incrementStock(productId: string, quantity: number) {
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: {
          increment: quantity
        }
      }
    });
  }
}