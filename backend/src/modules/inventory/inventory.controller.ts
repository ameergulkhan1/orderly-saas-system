import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';

export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  getInventory = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    // Middleware already validated & parsed query params — use them directly
    const result = await this.inventoryService.getInventory(
      businessId,
      req.query as any
    );
    return apiResponse.success(res, 200, 'Inventory fetched successfully', result);
  });

  getInventoryByProduct = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const businessId = (req as any).user.businessId;
    const result = await this.inventoryService.getInventoryByProduct(productId, businessId);
    return apiResponse.success(res, 200, 'Inventory fetched successfully', result);
  });

  updateStock = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const businessId = (req as any).user.businessId;
    // Middleware already validated — req.body is { quantity, reason }
    const result = await this.inventoryService.updateStock(
      productId,
      businessId,
      req.body
    );
    return apiResponse.success(res, 200, 'Stock updated successfully', result);
  });

  adjustStock = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const businessId = (req as any).user.businessId;
    // Middleware already validated — req.body is { adjustment, reason, type }
    const result = await this.inventoryService.adjustStock(
      productId,
      businessId,
      req.body
    );
    return apiResponse.success(res, 200, 'Stock adjusted successfully', result);
  });

  getInventoryTransactions = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const productId = req.query.productId as string | undefined;
    const type = req.query.type as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await this.inventoryService.getInventoryTransactions(
      businessId,
      productId,
      type,
      page,
      limit
    );
    return apiResponse.success(res, 200, 'Inventory transactions fetched successfully', result);
  });

  getLowStock = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const result = await this.inventoryService.getInventory(businessId, { status: 'ACTIVE' });
    const lowStockItems = result.data.filter(
      (p: { currentStock: number; lowStockThreshold: number }) =>
        p.currentStock <= p.lowStockThreshold && p.currentStock > 0
    );
    return apiResponse.success(res, 200, 'Low stock items fetched successfully', lowStockItems);
  });

  getOutOfStock = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const result = await this.inventoryService.getInventory(businessId, { status: 'ACTIVE' });
    const outOfStockItems = result.data.filter(
      (p: { currentStock: number }) => p.currentStock === 0
    );
    return apiResponse.success(res, 200, 'Out of stock items fetched successfully', outOfStockItems);
  });

  getInventorySummary = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const result = await this.inventoryService.getInventory(businessId, { limit: 1000 });
    const totalItems = result.data.length;
    const lowStockCount = result.data.filter(
      (p: { currentStock: number; lowStockThreshold: number }) =>
        p.currentStock <= p.lowStockThreshold && p.currentStock > 0
    ).length;
    const outOfStockCount = result.data.filter(
      (p: { currentStock: number }) => p.currentStock === 0
    ).length;

    return apiResponse.success(res, 200, 'Inventory summary fetched successfully', {
      totalItems,
      lowStockCount,
      outOfStockCount,
    });
  });

  getProductTransactions = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const businessId = (req as any).user.businessId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await this.inventoryService.getInventoryTransactions(
      businessId,
      productId,
      undefined,
      page,
      limit
    );
    return apiResponse.success(res, 200, 'Product transactions fetched successfully', result);
  });
}