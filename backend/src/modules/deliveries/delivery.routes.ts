import { Router } from 'express';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createDeliverySchema,
  updateDeliverySchema,
  updateDeliveryStatusSchema,
  deliveryQuerySchema
} from './delivery.validation';
import { prisma } from '../../config/database';

const router = Router();

// Initialize dependencies
const service = new DeliveryService(prisma);
const controller = new DeliveryController(service);

// All delivery routes require authentication
router.use(authenticate);

// GET /api/v1/deliveries - Get all deliveries
router.get('/', validate(deliveryQuerySchema), controller.getDeliveries);

// GET /api/v1/deliveries/status-summary - Get delivery status summary
router.get('/status-summary', controller.getDeliveryStatusSummary);

// GET /api/v1/deliveries/order/:orderId - Get delivery by order
router.get('/order/:orderId', controller.getDeliveryByOrder);

// POST /api/v1/orders/:orderId/delivery - Create delivery for order
// router.post('/orders/:orderId/delivery', validate(createDeliverySchema), controller.createDeliveryForOrder);

// GET /api/v1/deliveries/:id - Get delivery by ID
router.get('/:id', controller.getDeliveryById);

// PATCH /api/v1/deliveries/:id - Update delivery
router.patch('/:id', validate(updateDeliverySchema), controller.updateDelivery);

// PATCH /api/v1/deliveries/:id/status - Update delivery status
router.patch('/:id/status', validate(updateDeliveryStatusSchema), controller.updateDeliveryStatus);

// PATCH /api/v1/deliveries/:id/tracking - Update tracking
router.patch('/:id/tracking', controller.updateTracking);

export default router;