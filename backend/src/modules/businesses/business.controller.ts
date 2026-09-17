import { NextFunction, Request, Response } from 'express';
import { BusinessService } from './business.service';
// Use relative imports instead of @/
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { 
  createBusinessSchema, 
  updateBusinessSchema,
  inviteUserSchema,
  updateUserRoleSchema
} from './business.validation';

export class BusinessController {
  constructor(private businessService: BusinessService) {}

  createBusiness = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const validatedData = createBusinessSchema.parse(req.body);
    const result = await this.businessService.createBusiness(userId, validatedData);
    return apiResponse.success(res, 201, 'Business created successfully', result);
  });

  getBusinesses = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await this.businessService.getBusinesses(userId);
    return apiResponse.success(res, 200, 'Businesses fetched successfully', result);
  });

  getBusinessById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const result = await this.businessService.getBusinessById(id, userId);
    return apiResponse.success(res, 200, 'Business fetched successfully', result);
  });

  updateBusiness = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const validatedData = updateBusinessSchema.parse(req.body);
    const result = await this.businessService.updateBusiness(id, userId, validatedData);
    return apiResponse.success(res, 200, 'Business updated successfully', result);
  });

  updateBusinessSettings = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const validatedData = updateBusinessSchema.parse(req.body);
    const result = await this.businessService.updateBusiness(id, userId, validatedData);
    return apiResponse.success(res, 200, 'Business settings updated successfully', result);
  });

  getBusinessUsers = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const result = await this.businessService.getBusinessUsers(id, userId);
    return apiResponse.success(res, 200, 'Business users fetched successfully', result);
  });

  getBusinessSettings = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const result = await this.businessService.getBusinessSettings(id, userId);
    return apiResponse.success(res, 200, 'Business settings fetched successfully', result);
  });

  inviteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    const validatedData = inviteUserSchema.parse(req.body);
    const result = await this.businessService.inviteUser(id, userId, validatedData);
    return apiResponse.success(res, 201, 'User invited successfully', result);
  });

  updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const targetUserId = req.params.userId as string;
    const currentUserId = (req as any).user.id;
    const validatedData = updateUserRoleSchema.parse(req.body);
    const result = await this.businessService.updateUserRole(id, currentUserId, targetUserId, validatedData);
    return apiResponse.success(res, 200, 'User role updated successfully', result);
  });

  removeUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const targetUserId = req.params.userId as string;
    const currentUserId = (req as any).user.id;
    await this.businessService.removeUser(id, currentUserId, targetUserId);
    return apiResponse.success(res, 200, 'User removed from business successfully');
  });
}