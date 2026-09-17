import { Router } from 'express';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

const orderService = new OrderService(prisma);
const orderController = new OrderController(orderService);

router.use(authenticate);

router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id', orderController.updateOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.delete('/:id', orderController.deleteOrder);
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/:id/duplicate', orderController.duplicateOrder);
router.get('/:id/items', orderController.getOrderItems);
router.get('/:id/timeline', orderController.getOrderTimeline);
router.get('/:id/invoice', orderController.generateInvoice);
router.get('/:id/status-history', orderController.getOrderStatusHistory);

export default router;