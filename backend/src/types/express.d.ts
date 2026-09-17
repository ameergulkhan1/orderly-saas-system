import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        businessId: string;
        role: string;
        name?: string;
      };
      businessId: string;
      requestId: string;
    }
  }
}

export {};