import { PrismaClient, UserRole } from '@prisma/client';
import { HttpError } from '../../lib/httpError';

type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export class BusinessService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new business and attach it to the user.
   */
  async createBusiness(
    userId: string,
    data: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
    }
  ) {
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
      data: {
        businessId: business.id
      }
    });

    return business;
  }

  /**
   * Get all businesses owned by a user.
   */
  async getBusinesses(userId: string) {
    return this.prisma.business.findMany({
      where: {
        ownerId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get a specific business.
   */
  async getBusinessById(businessId: string, userId: string) {
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId
      }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    return business;
  }

  /**
   * Update business information.
   */
  async updateBusiness(
    businessId: string,
    userId: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
    }
  ) {
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId
      }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    return this.prisma.business.update({
      where: {
        id: businessId
      },
      data
    });
  }

  /**
   * Get users belonging to a business.
   */
  async getBusinessUsers(
    businessId: string,
    currentUserId: string
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: currentUserId
      }
    });

    if (
      !currentUser ||
      currentUser.businessId !== businessId
    ) {
      throw new HttpError(403, 'You do not have access to this business');
    }

    return this.prisma.user.findMany({
      where: {
        businessId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  /**
   * Get business settings.
   */
  async getBusinessSettings(
    businessId: string,
    userId: string
  ) {
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId
      }
    });

    if (!business) {
      throw new HttpError(404, 'Business not found');
    }

    return business;
  }

  /**
   * Invite a new user to the business.
   */
  async inviteUser(
    businessId: string,
    userId: string,
    data: {
      email: string;
      role: UserRole;
      name: string;
    }
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!currentUser) {
      throw new HttpError(404, 'User not found');
    }

    if (currentUser.businessId !== businessId) {
      throw new HttpError(
        403,
        'You do not have access to this business'
      );
    }

    if (
      currentUser.role !== UserRole.OWNER &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new HttpError(
        403,
        'Only owners and admins can invite users'
      );
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: data.email,
        businessId
      }
    });

    if (existingUser) {
      throw new HttpError(
        409,
        'A user with this email already exists in this business'
      );
    }

    // TODO:
    // Replace this temporary token with a proper invitation
    // system and email delivery when implemented.
    const inviteToken = `invite-${Date.now()}`;

    return {
      message: 'Invitation sent',
      inviteToken,
      email: data.email,
      name: data.name,
      role: data.role
    };
  }

  /**
   * Update a user's role.
   */
  async updateUserRole(
    businessId: string,
    currentUserId: string,
    targetUserId: string,
    data: {
      role: UserRole;
    }
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: currentUserId
      }
    });

    if (!currentUser) {
      throw new HttpError(404, 'Current user not found');
    }

    if (currentUser.businessId !== businessId) {
      throw new HttpError(
        403,
        'You do not have access to this business'
      );
    }

    if (
      currentUser.role !== UserRole.OWNER &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new HttpError(
        403,
        'Only owners and admins can update user roles'
      );
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        businessId
      }
    });

    if (!targetUser) {
      throw new HttpError(
        404,
        'Target user not found in this business'
      );
    }

    // Prevent an admin from changing the owner's role.
    if (
      targetUser.role === UserRole.OWNER &&
      currentUser.role !== UserRole.OWNER
    ) {
      throw new HttpError(
        403,
        'Only the owner can modify the owner account'
      );
    }

    // Only the owner can assign OWNER role.
    if (
      data.role === UserRole.OWNER &&
      currentUser.role !== UserRole.OWNER
    ) {
      throw new HttpError(
        403,
        'Only the owner can assign the OWNER role'
      );
    }

    return this.prisma.user.update({
      where: {
        id: targetUserId
      },
      data: {
        role: data.role
      }
    });
  }

  /**
   * Remove a user from active business access.
   *
   * The user is soft-removed by changing their status
   * to SUSPENDED instead of setting businessId to null.
   */
  async removeUser(
    businessId: string,
    currentUserId: string,
    targetUserId: string
  ) {
    const currentUser = await this.prisma.user.findUnique({
      where: {
        id: currentUserId
      }
    });

    if (!currentUser) {
      throw new HttpError(404, 'Current user not found');
    }

    if (currentUser.businessId !== businessId) {
      throw new HttpError(
        403,
        'You do not have access to this business'
      );
    }

    if (
      currentUser.role !== UserRole.OWNER &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new HttpError(
        403,
        'Only owners and admins can remove users'
      );
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        businessId
      }
    });

    if (!targetUser) {
      throw new HttpError(
        404,
        'Target user not found in this business'
      );
    }

    // Prevent removing the owner.
    if (targetUser.role === UserRole.OWNER) {
      throw new HttpError(
        403,
        'The business owner cannot be removed'
      );
    }

    // Prevent an admin from removing another admin.
    if (
      targetUser.role === UserRole.ADMIN &&
      currentUser.role !== UserRole.OWNER
    ) {
      throw new HttpError(
        403,
        'Only the owner can remove an admin'
      );
    }

    return this.prisma.user.update({
      where: {
        id: targetUserId
      },
      data: {
        status: 'SUSPENDED'
      }
    });
  }
}