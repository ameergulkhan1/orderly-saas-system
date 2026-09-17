import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

const customerService = new CustomerService(prisma);
const customerController = new CustomerController(customerService);

router.use(authenticate);

router.get('/', customerController.getCustomers);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomerById);
router.patch('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.get('/:id/orders', customerController.getCustomerOrders);
router.get('/:id/stats', customerController.getCustomerStats);
router.post('/search', customerController.searchCustomers);

export default router;