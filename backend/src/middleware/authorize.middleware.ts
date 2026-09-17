import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/httpError';

type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';

// ============================================
// Main role-check middleware
// ============================================
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const userRole = (req.user as any).role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      throw new HttpError(
        403,
        `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
        'FORBIDDEN'
      );
    }

    next();
  };
};

// ============================================
// Shorthand middleware helpers
// ============================================

// Owner only
export const requireOwner = requireRole('OWNER');

// Owner and Admin
export const requireAdmin = requireRole('OWNER', 'ADMIN');

// All authenticated users
export const requireAnyRole = requireRole('OWNER', 'ADMIN', 'STAFF');

// ============================================
// Check if user is owner of a specific resource
// ============================================
export const requireResourceOwner = (
  getResourceOwnerId: (req: Request) => Promise<string>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerId = await getResourceOwnerId(req);

      if ((req.user as any).id !== ownerId) {
        throw new HttpError(
          403,
          'You are not the owner of this resource',
          'NOT_RESOURCE_OWNER'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ============================================
// Check permission based on inviter role and target role
// ============================================
export const canInviteRole = (
  inviterRole: UserRole,
  targetRole: UserRole
): boolean => {
  // OWNER can invite ADMIN and STAFF
  if (inviterRole === 'OWNER') {
    return targetRole === 'ADMIN' || targetRole === 'STAFF';
  }

  // ADMIN can invite STAFF only
  if (inviterRole === 'ADMIN') {
    return targetRole === 'STAFF';
  }

  // STAFF cannot invite anyone
  return false;
};