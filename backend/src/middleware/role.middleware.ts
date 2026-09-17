import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/httpError';

type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';

// Authorization Middleware - What are you allowed to do?
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure user is authenticated first
    if (!req.user) {
      throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const userRole = req.user.role as UserRole;

    // Check if user's role is in allowed roles
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
// Role-based permission helpers
// ============================================

// Owner only (full access)
export const requireOwner = requireRole('OWNER');

// Owner and Admin
export const requireAdmin = requireRole('OWNER', 'ADMIN');

// All authenticated users (Owner, Admin, Staff)
export const requireAnyRole = requireRole('OWNER', 'ADMIN', 'STAFF');

// Check if user is owner of a specific resource
export const requireResourceOwner = (
  getResourceOwnerId: (req: Request) => Promise<string>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ownerId = await getResourceOwnerId(req);

      if (req.user.id !== ownerId) {
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

// ✅ NEW: Check permission based on inviter role and target role
export const canInviteRole = (inviterRole: UserRole, targetRole: UserRole): boolean => {
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