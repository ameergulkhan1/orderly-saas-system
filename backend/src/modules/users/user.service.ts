import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { HttpError } from '../../lib/httpError';

type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // LIST USERS
  // ============================================
  async getUsers(
    businessId: string,
    page: number,
    limit: number,
    role?: string,
    status?: string
  ) {
    const where: any = { businessId };

    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ============================================
  // GET USER BY ID
  // ============================================
  async getUserById(id: string, businessId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, businessId },
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

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    return user;
  }

  // ============================================
  // UPDATE USER
  // ============================================
  async updateUser(
    id: string,
    businessId: string,
    data: { name?: string; email?: string }
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, businessId }
    });

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          businessId,
          email: data.email,
          id: { not: id }
        }
      });

      if (existingUser) {
        throw new HttpError(409, 'Email already in use');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });
  }

  // ============================================
  // UPDATE USER STATUS
  // ============================================
  async updateUserStatus(
    id: string,
    businessId: string,
    data: { status: UserStatus }
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, businessId }
    });

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId }
    });

    if (business?.ownerId === id) {
      throw new HttpError(400, 'Cannot change status of the business owner');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: data.status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });
  }

  // ============================================
  // DELETE USER
  // ============================================
  async deleteUser(id: string, businessId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, businessId }
    });

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId }
    });

    if (business?.ownerId === id) {
      throw new HttpError(400, 'Cannot delete the business owner');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' }
    });
  }

  // ============================================
  // ✅ NEW: CREATE USER DIRECTLY (By Owner/Admin)
  // ============================================
  async createUserByOwner(
    businessId: string,
    creatorId: string,
    creatorRole: string,
    data: {
      name: string;
      email: string;
      password: string;
      role: 'ADMIN' | 'STAFF';
    }
  ) {
    // ✅ Role-based permission check
    if (creatorRole === 'STAFF') {
      throw new HttpError(403, 'Staff cannot create users');
    }

    if (creatorRole === 'ADMIN' && data.role === 'ADMIN') {
      throw new HttpError(403, 'Admin cannot create another Admin');
    }

    // ✅ Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new HttpError(409, 'User with this email already exists');
    }

    // ✅ Hash password
    const passwordHash = await hash(data.password, 12);

    // ✅ Create user
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        status: 'ACTIVE',
        businessId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    return user;
  }
}