import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { HttpError } from '../../lib/httpError';
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

export class AuthController {
  constructor(private authService: AuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse({ body: req.body });
    const result = await this.authService.register(validatedData.body);
    return apiResponse.success(res, 201, 'Registration successful', result);
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse({ body: req.body });
    const result = await this.authService.login(validatedData.body);
    return apiResponse.success(res, 200, 'Login successful', result);
  });

  // ============================================
  // GOOGLE AUTH
  // ============================================
  googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = googleAuthSchema.parse({ body: req.body });
    const result = await this.authService.googleLogin(validatedData.body);
    return apiResponse.success(res, 200, 'Login successful', result);
  });

  googleRegister = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = googleRegisterSchema.parse({ body: req.body });
    const result = await this.authService.googleRegister(validatedData.body);
    return apiResponse.success(res, 201, 'Registration successful', result);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = refreshTokenSchema.parse({ body: req.body });
    const result = await this.authService.refreshToken(validatedData.body);
    return apiResponse.success(res, 200, 'Token refreshed', result);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpError(401, 'User not authenticated');
    }
    await this.authService.logout(userId);
    return apiResponse.success(res, 200, 'Logout successful');
  });

  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpError(401, 'User not authenticated');
    }
    const result = await this.authService.getCurrentUser(userId);
    return apiResponse.success(res, 200, 'User fetched successfully', result);
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new HttpError(401, 'User not authenticated');
    }
    const validatedData = changePasswordSchema.parse({ body: req.body });
    await this.authService.changePassword(userId, validatedData.body);
    return apiResponse.success(res, 200, 'Password changed successfully');
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = forgotPasswordSchema.parse({ body: req.body });
    await this.authService.forgotPassword(validatedData.body);
    return apiResponse.success(res, 200, 'Password reset link sent');
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = resetPasswordSchema.parse({ body: req.body });
    await this.authService.resetPassword(validatedData.body);
    return apiResponse.success(res, 200, 'Password reset successfully');
  });
}