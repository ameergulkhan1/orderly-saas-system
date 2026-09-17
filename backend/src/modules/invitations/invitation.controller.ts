import { Request, Response } from 'express';
import { InvitationService } from './invitation.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import {
  createInvitationSchema,
  acceptInvitationSchema,
  invitationQuerySchema
} from './invitation.validation';

export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  create = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    // ✅ Parse body directly (not wrapped)
    const validatedData = createInvitationSchema.parse({ body: req.body });

    const result = await this.invitationService.createInvitation(
      businessId,
      userId,
      userRole,
      validatedData.body
    );

    return apiResponse.success(res, 201, 'Invitation sent successfully', result);
  });

  validate = asyncHandler(async (req: Request, res: Response) => {
    const token = req.params.token as string;
    const result = await this.invitationService.validateInvitation(token);
    return apiResponse.success(res, 200, 'Invitation is valid', result);
  });

  accept = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = acceptInvitationSchema.parse({ body: req.body });
    const result = await this.invitationService.acceptInvitation(validatedData.body);
    return apiResponse.success(res, 201, 'Invitation accepted successfully', result);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const validatedQuery = invitationQuerySchema.parse({ query: req.query });
    const result = await this.invitationService.listInvitations(businessId, validatedQuery.query);
    return apiResponse.success(res, 200, 'Invitations fetched successfully', result);
  });

  cancel = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const userId = (req as any).user.id;

    await this.invitationService.cancelInvitation(id, businessId, userId);
    return apiResponse.success(res, 200, 'Invitation cancelled successfully');
  });

  resend = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;

    const result = await this.invitationService.resendInvitation(id, businessId);
    return apiResponse.success(res, 200, 'Invitation resent successfully', result);
  });
}