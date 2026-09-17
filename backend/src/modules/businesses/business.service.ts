import { PrismaClient, UserRole } from '@prisma/client';
import { HttpError } from '../../lib/httpError';

type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export class BusinessService {
  constructor(private prisma: PrismaClient) {}

  async createBusiness(userId: string, data: { name: string; phone: string; email?: string; address?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    const existingBusiness = await this.prisma.business.findFirst({
      where: { ownerId: userId }
    });

    if (existingBusiness) {
      throw new HttpError(409, 'User already owns a business');
    }

    const business = await this.prisma.business.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        ownerId: userId
      }
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { businessId: business.id }
    });

    return business;
  }

  async getBusinesses(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { business: true }
    });

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    return user.business;
  }

  async getBusinessById(id: string, userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            lastLoginAt: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            customers: true,
            products: true,
            orders: true
          }
        }
      }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    const hasAccess = await this.prisma.user.findFirst({
      where: {
        id: userId,
        businessId: id
      }
    });

    if (!hasAccess && business.ownerId !== userId) {
      throw new HttpError(403, 'Access denied');
    }

    return business;
  }

  async updateBusiness(id: string, userId: string, data: any) {
    const business = await this.prisma.business.findUnique({
      where: { id }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    if (business.ownerId !== userId) {
      throw new HttpError(403, 'Only owner can update business details');
    }

    return this.prisma.business.update({
      where: { id },
      data
    });
  }

  async getBusinessUsers(id: string, userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    const hasAccess = await this.prisma.user.findFirst({
      where: {
        id: userId,
        businessId: id
      }
    });

    if (!hasAccess && business.ownerId !== userId) {
      throw new HttpError(403, 'Access denied');
    }

    return this.prisma.user.findMany({
      where: { businessId: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true
      }
    });
  }

  async getBusinessSettings(id: string, userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    const hasAccess = await this.prisma.user.findFirst({
      where: {
        id: userId,
        businessId: id
      }
    });

    if (!hasAccess && business.ownerId !== userId) {
      throw new HttpError(403, 'Access denied');
    }

    return {
      name: business.name,
      phone: business.phone,
      email: business.email,
      address: business.address,
      logoUrl: business.logoUrl,
      currency: business.currency,
      timezone: business.timezone
    };
  }

  async inviteUser(businessId: string, userId: string, data: { email: string; role: UserRole; name: string }) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    if (business.ownerId !== userId) {
      throw new HttpError(403, 'Only owner can invite users');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new HttpError(409, 'User already exists');
    }

    const inviteToken = `invite-${Date.now()}`;

    return {
      message: 'Invitation sent',
      inviteToken,
      email: data.email
    };
  }

  async updateUserRole(businessId: string, currentUserId: string, targetUserId: string, data: { role: UserRole }) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    if (business.ownerId !== currentUserId) {
      throw new HttpError(403, 'Only owner can change user roles');
    }

    if (targetUserId === business.ownerId) {
      throw new HttpError(400, 'Cannot change owner role');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        businessId
      }
    });

    if (!user) {
      throw new HttpError(404, 'User not found in this business');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: data.role }
    });
  }

  async removeUser(businessId: string, currentUserId: string, targetUserId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    if (business.ownerId !== currentUserId) {
      throw new HttpError(403, 'Only owner can remove users');
    }

    if (targetUserId === business.ownerId) {
      throw new HttpError(400, 'Cannot remove owner');
    }

    // ✅ FIX: Set status to SUSPENDED instead of setting businessId to null
    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { 
        status: 'SUSPENDED'
      }
    });
  }
}