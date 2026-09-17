import { Router } from 'express';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportRepository } from './report.repository';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { reportQuerySchema } from './report.types';
import { prisma } from '../../config/database';

const router = Router();

// Initialize dependencies
const repository = new ReportRepository(prisma);
const service = new ReportService(prisma);
const controller = new ReportController(service);

// All report routes require authentication
router.use(authenticate);

// GET /api/v1/reports/revenue - Revenue report
router.get('/revenue', validate(reportQuerySchema), controller.getRevenueReport);

// GET /api/v1/reports/orders - Orders report
router.get('/orders', validate(reportQuerySchema), controller.getOrdersReport);

// GET /api/v1/reports/products - Products report
router.get('/products', validate(reportQuerySchema), controller.getProductsReport);

// GET /api/v1/reports/customers - Customers report
router.get('/customers', validate(reportQuerySchema), controller.getCustomersReport);

// GET /api/v1/reports/top-products - Top products
router.get('/top-products', controller.getTopProducts);

// GET /api/v1/reports/top-customers - Top customers
router.get('/top-customers', controller.getTopCustomers);

// GET /api/v1/reports/order-status - Order status distribution
router.get('/order-status', controller.getOrderStatusReport);

// GET /api/v1/reports/cancelled - Cancelled orders report
router.get('/cancelled', controller.getCancelledOrdersReport);

// GET /api/v1/reports/returned - Returned orders report
router.get('/returned', controller.getReturnedOrdersReport);

// GET /api/v1/reports/export - Export report (CSV/PDF)
router.get('/export', controller.exportReport);

export default router;