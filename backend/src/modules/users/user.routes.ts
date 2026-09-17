import { Router } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/authorize.middleware';

const router = Router();

const userService = new UserService(prisma);
const userController = new UserController(userService);

// All routes require authentication
router.use(authenticate);

// ============================================
// ✅ SPECIFIC ROUTES FIRST (before /:id)
// ============================================
router.post(
  '/create',
  requireRole('OWNER', 'ADMIN'),
  userController.createUserByOwner
);

// ============================================
// GENERIC ROUTES AFTER
// ============================================
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id', userController.updateUser);
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'OWNER'),
  userController.updateUserStatus
);
router.delete(
  '/:id',
  requireRole('ADMIN', 'OWNER'),
  userController.deleteUser
);

export default router;