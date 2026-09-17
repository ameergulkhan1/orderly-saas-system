import { PrismaClient } from '@prisma/client';

export class InventoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findProductStock(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        lowStockThreshold: true
      }
    });
  }

  async getInventory(businessId: string, page: number, limit: number, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        lowStockThreshold: true,
        status: true,
        price: true,
        category: true,
        updatedAt: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { currentStock: 'asc' }
    });
  }

  async countInventory(businessId: string, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    return this.prisma.product.count({ where });
  }

  async createTransaction(data: any) {
    return this.prisma.inventoryTransaction.create({ data });
  }

  async getTransactions(businessId: string, page: number, limit: number, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.productId) {
      where.productId = filters.productId;
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }

    return this.prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            sku: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async countTransactions(businessId: string, filters?: any) {
    const where: any = { businessId };
    
    if (filters?.productId) {
      where.productId = filters.productId;
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }

    return this.prisma.inventoryTransaction.count({ where });
  }

  async getLowStockSummary(businessId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        businessId,
        status: 'ACTIVE',
        currentStock: {
          lte: 5
        }
      },
      select: {
        name: true,
        currentStock: true,
        lowStockThreshold: true
      }
    });

    return {
      count: products.length,
      items: products
    };
  }
}