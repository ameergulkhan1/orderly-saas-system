import { PrismaClient } from '@prisma/client';

export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { business: true }
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { business: true }
    });
  }

  async createUser(data: { email: string; passwordHash: string; name: string }) {
    return this.prisma.user.create({
      data
    });
  }

  async createBusiness(data: { name: string; phone: string; ownerId: string }) {
    return this.prisma.business.create({
      data
    });
  }

  async updateBusinessOwner(businessId: string, ownerId: string) {
    return this.prisma.business.update({
      where: { id: businessId },
      data: { ownerId }
    });
  }

  async updateUserBusiness(userId: string, businessId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { businessId }
    });
  }

  async createRefreshToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.prisma.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        revokedAt: null
      }
    });
  }

  async revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  async revokeAllUserTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  }
}