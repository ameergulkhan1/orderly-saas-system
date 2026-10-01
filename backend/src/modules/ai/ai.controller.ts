import { Request, Response } from 'express';
import { AIService } from './ai.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { HttpError } from '../../lib/httpError';
import { z } from 'zod';
import type { UserRole } from '@prisma/client';

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(500),
  }),
});

export class AIController {
  constructor(private aiService: AIService) {}

  chat = asyncHandler(async (req: Request, res: Response) => {
    // Type-safe access to the authenticated user
    const user = req.user;
    if (!user) {
      throw new HttpError(401, 'User not authenticated', 'NOT_AUTHENTICATED');
    }

    const { businessId } = user;

    // Validate body
    const validated = chatSchema.parse({ body: req.body });
    const { message } = validated.body;

    // Call the service — signature: chat(businessId, message)
    const result = await this.aiService.chat(businessId, message);

    return apiResponse.success(res, 200, 'AI response', result);
  });
}