import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import businessRoutes from '../modules/businesses/business.routes';
import userRoutes from '../modules/users/user.routes';
import customerRoutes from '../modules/customers/customer.routes';
import productRoutes from '../modules/products/product.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';
import orderRoutes from '../modules/orders/order.routes';
import paymentRoutes from '../modules/payments/payment.routes';
import deliveryRoutes from '../modules/deliveries/delivery.routes';
import reportRoutes from '../modules/reports/report.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import invitationRoutes from '../modules/invitations/invitation.routes';
const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

// All routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/business`, businessRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/customers`, customerRoutes);
router.use(`${API_VERSION}/products`, productRoutes);
router.use(`${API_VERSION}/inventory`, inventoryRoutes);
router.use(`${API_VERSION}/orders`, orderRoutes);
router.use(`${API_VERSION}/payments`, paymentRoutes);
router.use(`${API_VERSION}/deliveries`, deliveryRoutes);
router.use(`${API_VERSION}/reports`, reportRoutes);
router.use(`${API_VERSION}/dashboard`, dashboardRoutes);
router.use(`${API_VERSION}/invitations`, invitationRoutes);

// Health check
router.get('/api/v1/health', (_req: any, res: { json: (arg0: { status: string; timestamp: string; }) => void; }) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;