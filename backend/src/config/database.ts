import { PrismaClient, Prisma } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

// Extend PrismaClient with custom methods
export class ExtendedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
  }

  async withTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await this.$transaction(async (tx: any) => {
          return await fn(tx as Prisma.TransactionClient);
        });
      } catch (error) {
        attempts++;
        if (attempts === maxRetries) {
          throw error;
        }
        logger.warn(`Transaction attempt ${attempts} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts)));
      }
    }
    throw new Error('Transaction failed after max retries');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

let prismaInstance: ExtendedPrismaClient | null = null;

export const getPrisma = (): ExtendedPrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new ExtendedPrismaClient();
  }
  return prismaInstance;
};

export const prisma = getPrisma();