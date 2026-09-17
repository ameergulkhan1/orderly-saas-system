import { Router } from 'express';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { prisma } from '../../config/database';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import {
  createBusinessSchema,
  updateBusinessSchema,
  inviteUserSchema,
  updateUserRoleSchema
} from './business.validation';

const router = Router();

const businessService = new BusinessService(prisma);
const businessController = new BusinessController(businessService);

router.use(authenticate);

router.get('/', businessController.getBusinesses);
router.post('/', validate(createBusinessSchema), businessController.createBusiness);
router.get('/:id', businessController.getBusinessById);
router.patch('/:id', validate(updateBusinessSchema), businessController.updateBusiness);
router.get('/:id/settings', businessController.getBusinessSettings);
router.patch('/:id/settings', validate(updateBusinessSchema), businessController.updateBusinessSettings);
router.get('/:id/users', businessController.getBusinessUsers);
router.post('/:id/users/invite', requireRole('OWNER'), validate(inviteUserSchema), businessController.inviteUser);
router.patch('/:id/users/:userId/role', requireRole('OWNER'), validate(updateUserRoleSchema), businessController.updateUserRole);
router.delete('/:id/users/:userId', requireRole('OWNER'), businessController.removeUser);

export default router;