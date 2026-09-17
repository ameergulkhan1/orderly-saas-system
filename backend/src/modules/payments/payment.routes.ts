import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

const paymentService = new PaymentService(prisma);
const paymentController = new PaymentController(paymentService);

router.use(authenticate);

router.get('/', paymentController.getPayments);
router.get('/summary', paymentController.getPaymentSummary);
router.get('/methods', paymentController.getPaymentMethodsBreakdown);
router.get('/order/:orderId', paymentController.getOrderPayments);
router.post('/record', paymentController.recordPayment);
router.post('/', paymentController.createPayment);
router.get('/:id', paymentController.getPaymentById);
router.patch('/:id', paymentController.updatePayment);

export default router;