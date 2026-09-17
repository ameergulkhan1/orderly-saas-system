import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { prisma } from '../../config/database';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
  googleRegisterSchema,
} from './auth.validation';

const router = Router();

const authService = new AuthService(prisma);
const authController = new AuthController(authService);

// ============================================
// Public routes
// ============================================
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

// Google OAuth (Firebase ID token exchange)
router.post('/google', validate(googleAuthSchema), authController.googleLogin);
router.post(
  '/google/register',
  validate(googleRegisterSchema),
  authController.googleRegister
);

router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshToken
);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ============================================
// Protected routes
// ============================================
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.patch(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;