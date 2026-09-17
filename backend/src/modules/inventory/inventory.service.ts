import { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/httpError';

type InventoryTransactionType = 'RESTOCK' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE';

export class InventoryService {
  constructor(private prisma: PrismaClient) {}

  async getInventory(businessId: string, query: { search?: string; status?: string; page?: number; limit?: number }) {
    const { search, status, page = 1, limit = 20 } = query;

    const where: any = { businessId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
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

  async getInventoryByProduct(productId: string, businessId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        businessId
      },
      include: {
        inventoryTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!product) {
      throw new HttpError(404, 'Product not found');
    }

    return product;
  }

  async updateStock(productId: string, businessId: string, data: { quantity: number; reason?: string }) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        businessId
      }
    });

    if (!product) {
      throw new HttpError(404, 'Product not found');
    }

    if (data.quantity < 0) {
      throw new HttpError(400, 'Stock quantity cannot be negative');
    }

    const previousStock = product.currentStock;

    // ✅ FIX: Don't type the tx parameter - let Prisma infer it
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { currentStock: data.quantity }
      });

      await tx.inventoryTransaction.create({
        data: {
          businessId,
          productId,
          type: 'ADJUSTMENT',
          quantity: data.quantity - previousStock,
          previousStock,
          newStock: data.quantity,
          reason: data.reason || 'Manual stock update'
        }
      });

      return updated;
    });

    return result;
  }

  async adjustStock(productId: string, businessId: string, data: { adjustment: number; reason: string; type: InventoryTransactionType }) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        businessId
      }
    });

    if (!product) {
      throw new HttpError(404, 'Product not found');
    }

    const newStock = product.currentStock + data.adjustment;

    if (newStock < 0) {
      throw new HttpError(400, 'Stock cannot go below zero');
    }

    const previousStock = product.currentStock;

    // ✅ FIX: Don't type the tx parameter
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock }
      });

      await tx.inventoryTransaction.create({
        data: {
          businessId,
          productId,
          type: data.type,
          quantity: data.adjustment,
          previousStock,
          newStock,
          reason: data.reason
        }
      });

      return updated;
    });

    return result;
  }

  async getInventoryTransactions(businessId: string, productId?: string, type?: string, page: number = 1, limit: number = 20) {
    const where: any = { businessId };

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
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
      }),
      this.prisma.inventoryTransaction.count({ where })
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}