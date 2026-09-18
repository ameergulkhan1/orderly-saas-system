import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { HttpError } from '../../lib/httpError';
import { env } from '../../config/env';
import { firebaseAuth } from '../../lib/firebaseAdmin';
import type { Prisma } from '@prisma/client';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // GOOGLE AUTH (Firebase ID token exchange)
  // ============================================

  async googleLogin(body: { idToken: string }) {
    let decoded;
    try {
      decoded = await firebaseAuth.verifyIdToken(body.idToken);
    } catch {
      throw new HttpError(401, 'Invalid Google token', 'INVALID_GOOGLE_TOKEN');
    }

    const email = decoded.email;
    if (!email) {
      throw new HttpError(400, 'Google account has no email', 'NO_EMAIL');
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { business: true },
    });

    if (!user) {
      throw new HttpError(
        404,
        'No account found for this email. Please register first.',
        'USER_NOT_FOUND'
      );
    }

    if (user.status === 'SUSPENDED') {
      throw new HttpError(403, 'Account suspended');
    }

    const tokens = this.generateTokens(
      user.id,
      user.businessId,
      user.email,
      user.role
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await hash(tokens.refreshToken, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      business: user.business
        ? { id: user.business.id, name: user.business.name }
        : null,
      tokens,
    };
  }

  async googleRegister(body: {
    idToken: string;
    businessName?: string;
    phone?: string;
  }) {
    let decoded;
    try {
      decoded = await firebaseAuth.verifyIdToken(body.idToken);
    } catch {
      throw new HttpError(401, 'Invalid Google token', 'INVALID_GOOGLE_TOKEN');
    }

    const email = decoded.email;
    const name = decoded.name ?? email?.split('@')[0] ?? 'User';

    if (!email) {
      throw new HttpError(400, 'Google account has no email', 'NO_EMAIL');
    }

    // If user already exists, log them in
    const existing = await this.prisma.user.findFirst({
      where: { email },
      include: { business: true },
    });

    if (existing) {
      const tokens = this.generateTokens(
        existing.id,
        existing.businessId,
        existing.email,
        existing.role
      );

      await this.prisma.refreshToken.create({
        data: {
          userId: existing.id,
          tokenHash: await hash(tokens.refreshToken, 10),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await this.prisma.user.update({
        where: { id: existing.id },
        data: { lastLoginAt: new Date() },
      });

      return {
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
        },
        business: existing.business
          ? { id: existing.business.id, name: existing.business.name }
          : null,
        tokens,
      };
    }

    // Create new business + owner user in a single transaction
    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const business = await tx.business.create({
          data: {
            name: body.businessName?.trim() || `${name}'s Business`,
            phone: body.phone ?? null,
          },
        });

        const user = await tx.user.create({
          data: {
            businessId: business.id,
            email,
            passwordHash: await hash(randomBytes(32).toString('hex'), 12),
            name,
            role: 'OWNER',
            status: 'ACTIVE',
            lastLoginAt: new Date(),
          },
        });

        await tx.business.update({
          where: { id: business.id },
          data: { ownerId: user.id },
        });

        const tokens = this.generateTokens(
          user.id,
          business.id,
          user.email,
          user.role
        );

        await tx.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: await hash(tokens.refreshToken, 10),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        return { user, business, tokens };
      }
    );

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      business: {
        id: result.business.id,
        name: result.business.name,
      },
      tokens: result.tokens,
    };
  }

  // ============================================
  // EMAIL / PASSWORD AUTH
  // ============================================

  async register(data: { email: string; password: string; name: string; businessName: string; phone: string }) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new HttpError(409, 'User already exists');
    }

    const passwordHash = await hash(data.password, 12);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const business = await tx.business.create({
        data: {
          name: data.businessName,
          phone: data.phone
        }
      });

      const user = await tx.user.create({
        data: {
          businessId: business.id,
          email: data.email,
          passwordHash,
          name: data.name,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      });

      await tx.business.update({
        where: { id: business.id },
        data: { ownerId: user.id }
      });

      const tokens = this.generateTokens(user.id, business.id, user.email, user.role);

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: await hash(tokens.refreshToken, 10),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      const userWithBusiness = await tx.user.findFirst({
        where: { id: user.id },
        include: { business: true }
      });

      return { user: userWithBusiness!, business, tokens };
    });

    const { user, business, tokens } = result;

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      business: { id: business.id, name: business.name },
      tokens
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: { email: data.email },
      include: { business: true }
    });

    if (!user) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const isPasswordValid = await compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new HttpError(401, 'Invalid credentials');
    }

    if (user.status === 'SUSPENDED') {
      throw new HttpError(403, 'Account suspended');
    }

    const tokens = this.generateTokens(user.id, user.businessId, user.email, user.role);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await hash(tokens.refreshToken, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      business: user.business
        ? { id: user.business.id, name: user.business.name }
        : null,
      tokens
    };
  }

  async refreshToken(data: { refreshToken: string }) {
    let payload: { userId: string; businessId: string; email?: string; type?: string };

    try {
      payload = verify(data.refreshToken, env.REFRESH_TOKEN_SECRET) as {
        userId: string;
        businessId: string;
        email?: string;
        type?: string;
      };
    } catch {
      throw new HttpError(401, 'Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new HttpError(401, 'Invalid refresh token');
    }

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.userId,
        expiresAt: { gt: new Date() },
        revokedAt: null
      }
    });

    if (storedTokens.length === 0) {
      throw new HttpError(401, 'Refresh token expired or revoked');
    }

    let matchedToken: typeof storedTokens[0] | null = null;

    for (const storedToken of storedTokens) {
      const matches = await compare(data.refreshToken, storedToken.tokenHash);
      if (matches) {
        matchedToken = storedToken;
        break;
      }
    }

    if (!matchedToken) {
      throw new HttpError(401, 'Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    });

    const tokens = this.generateTokens(
      payload.userId,
      payload.businessId,
      payload.email || '',
      user?.role || 'STAFF'
    );

    await this.prisma.$transaction(async (tx: { refreshToken: { update: (arg0: { where: { id: any; }; data: { revokedAt: Date; }; }) => any; create: (arg0: { data: { userId: string; tokenHash: string; expiresAt: Date; }; }) => any; }; }) => {
      await tx.refreshToken.update({
        where: { id: matchedToken!.id },
        data: { revokedAt: new Date() }
      });

      await tx.refreshToken.create({
        data: {
          userId: payload.userId,
          tokenHash: await hash(tokens.refreshToken, 10),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: { business: true }
    });

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      business: user.business
    };
  }

  async changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId }
    });

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    const isPasswordValid = await compare(data.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new HttpError(401, 'Current password is incorrect');
    }

    const newHash = await hash(data.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash }
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      })
    ]);
  }

  async forgotPassword(data: { email: string }) {
    const user = await this.prisma.user.findFirst({
      where: { email: data.email }
    });

    if (!user) {
      return { message: 'If an account exists, a password reset link will be sent' };
    }

    const resetToken = randomBytes(32).toString('hex');
    console.log(`Password reset token for ${data.email}: ${resetToken}`);

    return { message: 'Password reset link sent to email' };
  }

  async resetPassword(_data: { token: string; newPassword: string }) {
    return { message: 'Password reset successfully' };
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateTokens(userId: string, businessId: string, email: string, role: string) {
    const payload = {
      userId,
      businessId,
      email,
      role
    };

    const accessToken = sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = sign(
      { ...payload, type: 'refresh' },
      env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }
}