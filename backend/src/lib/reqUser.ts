// src/lib/reqUser.ts

import type { Request } from 'express';
import type { UserRole } from '@prisma/client';
import { HttpError } from './httpError';

export interface AuthedUser {
  id: string;
  email: string;
  businessId: string;
  role: UserRole;
  name?: string;
}

/**
 * Returns the authenticated user or throws 401.
 *
 * Use in any controller that is behind `authenticate` middleware.
 * Guarantees a non-undefined user object, so callers don't need
 * optional chaining or non-null assertions.
 */
export function requireUser(req: Request): AuthedUser {
  if (!req.user) {
    throw new HttpError(401, 'User not authenticated', 'NOT_AUTHENTICATED');
  }
  return req.user as AuthedUser;
}

/**
 * Returns the tenant businessId or throws 403.
 *
 * Requires `tenantMiddleware` to have run (or `authenticate` to have set
 * `user.businessId`). Prefer this over `req.businessId` to avoid null checks.
 */
export function requireBusinessId(req: Request): string {
  const businessId = req.user?.businessId ?? req.businessId;
  if (!businessId) {
    throw new HttpError(403, 'No business context found', 'NO_BUSINESS_CONTEXT');
  }
  return businessId;
}