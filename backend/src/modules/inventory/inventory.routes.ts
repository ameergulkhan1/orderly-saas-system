import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  updateStockSchema,
  adjustStockSchema,
  inventoryQuerySchema
} from './inventory.validation';
import { prisma } from '../../database/prisma';

const router = Router();

// Initialize dependencies
const repository = new InventoryRepository(prisma);
const service = new InventoryService(prisma);
const controller = new InventoryController(service);

// All inventory routes require authentication
router.use(authenticate);

// GET /api/v1/inventory/low-stock - Get low stock items
router.get('/low-stock', controller.getLowStock);

// GET /api/v1/inventory/out-of-stock - Get out of stock items
router.get('/out-of-stock', controller.getOutOfStock);

// GET /api/v1/inventory/summary - Get inventory summary
router.get('/summary', controller.getInventorySummary);

// GET /api/v1/inventory/transactions - Get inventory transactions
router.get('/transactions', controller.getInventoryTransactions);

// GET /api/v1/inventory - Get all inventory with pagination and filters
router.get('/', validate(inventoryQuerySchema), controller.getInventory);

// GET /api/v1/inventory/:productId - Get inventory by product ID
router.get('/:productId', controller.getInventoryByProduct);

// PATCH /api/v1/inventory/:productId/stock - Update stock
router.patch('/:productId/stock', validate(updateStockSchema), controller.updateStock);

// POST /api/v1/inventory/:productId/adjust - Adjust stock
router.post('/:productId/adjust', validate(adjustStockSchema), controller.adjustStock);

// GET /api/v1/inventory/:productId/transactions - Get product inventory transactions
router.get('/:productId/transactions', controller.getProductTransactions);

export default router;