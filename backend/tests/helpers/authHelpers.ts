import { sign } from 'jsonwebtoken';
import { env } from '../../src/config/env';

export const generateTestToken = (userId: string, businessId: string, role: string = 'OWNER') => {
  return sign(
    { userId, businessId, role, email: 'test@user.com' },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateTestRefreshToken = (userId: string, businessId: string) => {
  return sign(
    { userId, businessId, type: 'refresh' },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

export const createAuthHeaders = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};