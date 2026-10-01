import { Request, Response } from 'express';
import { OnboardingService } from './onboarding.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { HttpError } from '../../lib/httpError';
import { completeOnboardingSchema } from './onboarding.validation';

export class OnboardingController {
  constructor(private service: OnboardingService) {}

  /**
   * POST /api/v1/onboarding/complete
   * Runs the full onboarding in one shot.
   */
  complete = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new HttpError(401, 'User not authenticated', 'NOT_AUTHENTICATED');
    }

    const validated = completeOnboardingSchema.parse({ body: req.body });

    const result = await this.service.complete(user.businessId, validated.body);

    return apiResponse.success(
      res,
      200,
      result.alreadyCompleted
        ? 'Onboarding already completed'
        : 'Onboarding completed',
      result
    );
  });

  /**
   * GET /api/v1/onboarding/status
   * Used by the dashboard to redirect sellers who haven't finished.
   */
  status = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new HttpError(401, 'User not authenticated', 'NOT_AUTHENTICATED');
    }

    const result = await this.service.getStatus(user.businessId);

    return apiResponse.success(res, 200, 'Onboarding status', result);
  });
}