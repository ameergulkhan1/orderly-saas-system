import { PrismaClient } from '@prisma/client';

export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { business: true },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { business: true },
    });
  }

  /**
   * Create a user that belongs to an existing business.
   * `businessId` is required by the Prisma schema.
   */
  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    businessId: string;
    role?: 'OWNER' | 'ADMIN' | 'STAFF';
    status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        businessId: data.businessId,
        ...(data.role ? { role: data.role } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });
  }

  async createBusiness(data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    ownerId?: string;
  }) {
    return this.prisma.business.create({
      data: {
        name: data.name,
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.address ? { address: data.address } : {}),
        ...(data.ownerId ? { ownerId: data.ownerId } : {}),
      },
    });
  }

  async updateBusinessOwner(businessId: string, ownerId: string) {
    return this.prisma.business.update({
      where: { id: businessId },
      data: { ownerId },
    });
  }

  async updateUserBusiness(userId: string, businessId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { businessId },
    });
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    });
  }

  async revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}