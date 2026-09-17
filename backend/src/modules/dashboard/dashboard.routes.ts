import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { authenticate } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';

const router = Router();

// Initialize dependencies
const service = new DashboardService(prisma);
const controller = new DashboardController(service);

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/v1/dashboard/stats - Main dashboard stats
router.get('/stats', controller.getStats);

// GET /api/v1/dashboard/revenue-chart - Revenue chart data
router.get('/revenue-chart', controller.getRevenueChart);

// GET /api/v1/dashboard/order-status - Order status distribution
router.get('/order-status', controller.getOrderStatusDistribution);

// GET /api/v1/dashboard/low-stock - Low stock items
router.get('/low-stock', controller.getLowStock);

// GET /api/v1/dashboard/recent-orders - Recent orders
router.get('/recent-orders', controller.getRecentOrders);

// GET /api/v1/dashboard/today - Today's summary
router.get('/today', controller.getTodaySummary);

export default router;