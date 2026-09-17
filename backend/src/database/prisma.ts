import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Export a singleton PrismaClient instance
let prismaInstance: PrismaClient | null = null;

export const getPrisma = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
  }
  return prismaInstance;
};

export const prisma = getPrisma();

export const disconnectPrisma = async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
};

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// ============================================
// PRISMA MIDDLEWARE - FIXED
// ============================================

// ✅ FIX: Use 'any' type for params to avoid TypeScript errors
// The params object structure varies depending on the operation
prisma.$use(async (params: any, next: any) => {
  const start = Date.now();
  
  try {
    const result = await next(params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 100ms)
    if (duration > 100) {
      logger.warn({
        message: `Slow query detected`,
        model: params.model || 'unknown',
        action: params.action,
        duration: `${duration}ms`,
      });
    }
    
    return result;
  } catch (error) {
    logger.error({
      message: `Database query failed`,
      model: params.model || 'unknown',
      action: params.action,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
});

// ✅ FIX: Security middleware with 'any' type
// Check for missing businessId in tenant models
prisma.$use(async (params: any, next: any) => {
  const tenantModels = ['Customer', 'Product', 'Order', 'Payment', 'Delivery', 'InventoryTransaction'];
  
  if (params.model && tenantModels.includes(params.model) && params.action === 'findMany') {
    // Log warning if businessId is missing (security concern)
    if (params.args?.where && !params.args.where.businessId) {
      logger.warn({
        message: `Query without businessId detected - possible security issue`,
        model: params.model,
        action: params.action,
      });
    }
  }
  
  return next(params);
});