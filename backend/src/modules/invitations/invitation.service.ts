import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { HttpError } from '../../lib/httpError';

type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';

export class InvitationService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // CREATE INVITATION
  // ============================================
  async createInvitation(
    businessId: string,
    inviterId: string,
    inviterRole: UserRole,
    data: { email: string; name: string; role: 'ADMIN' | 'STAFF' }
  ) {
    // ✅ Check permission based on inviter role
    if (inviterRole === 'STAFF') {
      throw new HttpError(403, 'Staff cannot invite users');
    }

    if (inviterRole === 'ADMIN' && data.role === 'ADMIN') {
      throw new HttpError(403, 'Admin cannot invite another Admin');
    }

    // ✅ Check if email already exists as a user
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new HttpError(409, 'User with this email already exists');
    }

    // ✅ Check if pending invitation already exists
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        businessId,
        email: data.email,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      throw new HttpError(409, 'Invitation already sent to this email');
    }

    // ✅ Generate secure token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = await hash(rawToken, 10);

    // ✅ Create invitation
    const invitation = await this.prisma.invitation.create({
      data: {
        businessId,
        email: data.email,
        name: data.name,
        role: data.role,
        tokenHash,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        invitedBy: inviterId
      }
    });

    // ✅ In production, send email here
    const inviteUrl = `http://localhost:3000/accept-invitation?token=${rawToken}`;
    console.log(`📧 Invitation URL for ${data.email}: ${inviteUrl}`);

    return {
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      inviteUrl // Return for dev testing
    };
  }

  // ============================================
  // VALIDATE INVITATION (Public)
  // ============================================
  async validateInvitation(rawToken: string) {
    // Find all pending invitations and check token
    const invitations = await this.prisma.invitation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      include: {
        business: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Find matching invitation by comparing token hash
    let matchedInvitation = null;
    const { compare } = await import('bcryptjs');

    for (const invitation of invitations) {
      const matches = await compare(rawToken, invitation.tokenHash);
      if (matches) {
        matchedInvitation = invitation;
        break;
      }
    }

    if (!matchedInvitation) {
      throw new HttpError(404, 'Invalid or expired invitation');
    }

    // Check if already accepted
    if (matchedInvitation.acceptedAt) {
      throw new HttpError(400, 'Invitation already accepted');
    }

    // Get inviter details
    const inviter = await this.prisma.user.findFirst({
      where: { id: matchedInvitation.invitedBy },
      select: { name: true }
    });

    return {
      businessName: matchedInvitation.business.name,
      inviterName: inviter?.name || 'Someone',
      email: matchedInvitation.email,
      name: matchedInvitation.name,
      role: matchedInvitation.role,
      expiresAt: matchedInvitation.expiresAt
    };
  }

  // ============================================
  // ACCEPT INVITATION (Public)
  // ============================================
  async acceptInvitation(data: { token: string; name: string; password: string }) {
    // Find matching pending invitation
    const invitations = await this.prisma.invitation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        acceptedAt: null
      }
    });

    let matchedInvitation = null;
    const { compare } = await import('bcryptjs');

    for (const invitation of invitations) {
      const matches = await compare(data.token, invitation.tokenHash);
      if (matches) {
        matchedInvitation = invitation;
        break;
      }
    }

    if (!matchedInvitation) {
      throw new HttpError(404, 'Invalid or expired invitation');
    }

    // Check if email is already registered
    const existingUser = await this.prisma.user.findFirst({
      where: { email: matchedInvitation.email }
    });

    if (existingUser) {
      throw new HttpError(409, 'Email already registered');
    }

    const passwordHash = await hash(data.password, 12);

    // ✅ Create user + mark invitation accepted in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: matchedInvitation.email,
          name: data.name || matchedInvitation.name,
          passwordHash,
          role: matchedInvitation.role,
          status: 'ACTIVE',
          businessId: matchedInvitation.businessId
        }
      });

      // Mark invitation accepted
      await tx.invitation.update({
        where: { id: matchedInvitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      });

      return user;
    });

    return result;
  }

  // ============================================
  // LIST INVITATIONS (Business)
  // ============================================
  async listInvitations(
    businessId: string,
    query: { page?: number; limit?: number; status?: string }
  ) {
    const { page = 1, limit = 20, status } = query;

    const where: any = { businessId };
    if (status) where.status = status;

    const [invitations, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          expiresAt: true,
          acceptedAt: true,
          createdAt: true
        }
      }),
      this.prisma.invitation.count({ where })
    ]);

    return {
      data: invitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ============================================
  // CANCEL INVITATION
  // ============================================
  async cancelInvitation(id: string, businessId: string, userId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, businessId }
    });

    if (!invitation) {
      throw new HttpError(404, 'Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new HttpError(400, 'Only pending invitations can be cancelled');
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  }

  // ============================================
  // RESEND INVITATION
  // ============================================
  async resendInvitation(id: string, businessId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, businessId }
    });

    if (!invitation) {
      throw new HttpError(404, 'Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new HttpError(400, 'Only pending invitations can be resent');
    }

    // Generate new token
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = await hash(rawToken, 10);

    const updated = await this.prisma.invitation.update({
      where: { id },
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const inviteUrl = `http://localhost:3000/accept-invitation?token=${rawToken}`;
    console.log(`📧 Resent invitation for ${invitation.email}: ${inviteUrl}`);

    return {
      id: updated.id,
      email: updated.email,
      inviteUrl
    };
  }
}