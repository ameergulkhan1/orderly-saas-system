import { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/httpError';

export class ProductService {
  constructor(private prisma: PrismaClient) {}

  async createProduct(businessId: string, data: { 
    name: string; sku?: string; description?: string; category?: string; 
    price: number; costPrice?: number; currentStock?: number; lowStockThreshold?: number 
  }) {
    // Check if SKU is unique
    if (data.sku) {
      const existing = await this.prisma.product.findFirst({
        where: {
          businessId,
          sku: data.sku
        }
      });

      if (existing) {
        throw new HttpError(409, 'Product with this SKU already exists');
      }
    }

    return this.prisma.product.create({
      data: {
        ...data,
        businessId,
        currentStock: data.currentStock || 0
      }
    });
  }

  async getProducts(businessId: string, query: { search?: string; category?: string; status?: string; page?: number; limit?: number }) {
    const { search, category, status, page = 1, limit = 20 } = query;

    const where: any = { businessId };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          _count: {
            select: { orderItems: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getProductById(id: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        businessId
      },
      include: {
        inventoryTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!product) {
      throw new HttpError(404, 'Product not found');
    }

    return product;
  }

  async updateProduct(id: string, businessId: string, data: any) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!product) {
      throw new HttpError(404, 'Product not found');
    }

    // Check SKU uniqueness if being updated
    if (data.sku && data.sku !== product.sku) {
      const existing = await this.prisma.product.findFirst({
        where: {
          businessId,
          sku: data.sku,
          id: { not: id }
        }
      });

      if (existing) {
        throw new HttpError(409, 'Product with this SKU already exists');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data
    });
  }

  async deleteProduct(id: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!product) {
      throw new HttpError(404, 'Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
  }

  async getLowStockProducts(businessId: string) {
    return this.prisma.product.findMany({
      where: {
        businessId,
        status: 'ACTIVE',
        currentStock: {
          lte: 5
        }
      },
      orderBy: { currentStock: 'asc' }
    });
  }
}