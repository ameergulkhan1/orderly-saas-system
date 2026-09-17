// src/types/express.d.ts
//
// The ONLY place that augments Express's Request type.
// Middleware and controllers must NOT redeclare these fields.

import type { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        businessId: string;
        role: UserRole;
        name?: string;
      };
      businessId: string;
      requestId: string;
    }
  }
}

export {};