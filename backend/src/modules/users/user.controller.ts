import { Request, Response } from 'express';
import { UserService } from './user.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { HttpError } from '../../lib/httpError';
import { z } from 'zod';

// ✅ Schema for direct user creation
const createUserByOwnerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(255),
    password: z.string().min(8).max(255),
    role: z.enum(['ADMIN', 'STAFF'])
  })
});

export class UserController {
  constructor(private userService: UserService) {}

  // ============================================
  // LIST USERS
  // ============================================
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const result = await this.userService.getUsers(
      businessId,
      page,
      limit,
      role,
      status
    );

    return apiResponse.success(res, 200, 'Users fetched successfully', result);
  });

  // ============================================
  // GET USER BY ID
  // ============================================
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;

    const result = await this.userService.getUserById(id, businessId);
    return apiResponse.success(res, 200, 'User fetched successfully', result);
  });

  // ============================================
  // UPDATE USER
  // ============================================
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const body = req.body as { name?: string; email?: string };

    const result = await this.userService.updateUser(id, businessId, body);
    return apiResponse.success(res, 200, 'User updated successfully', result);
  });

  // ============================================
  // UPDATE USER STATUS
  // ============================================
  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const body = req.body as { status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' };

    const result = await this.userService.updateUserStatus(id, businessId, body);
    return apiResponse.success(res, 200, 'User status updated successfully', result);
  });

  // ============================================
  // DELETE USER
  // ============================================
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;

    await this.userService.deleteUser(id, businessId);
    return apiResponse.success(res, 200, 'User deleted successfully');
  });

  // ============================================
  // ✅ NEW: CREATE USER DIRECTLY
  // ============================================
  createUserByOwner = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const creatorId = (req as any).user.id;
    const creatorRole = (req as any).user.role;

    const validatedData = createUserByOwnerSchema.parse({ body: req.body });

    const result = await this.userService.createUserByOwner(
      businessId,
      creatorId,
      creatorRole,
      validatedData.body
    );

    return apiResponse.success(res, 201, 'User created successfully', result);
  });
}