import { sign, verify, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  userId: string;
  businessId: string;
  email?: string;
  role?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: (env.ACCESS_TOKEN_EXPIRY || '15m') as any,
  };
  return sign(payload, env.ACCESS_TOKEN_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: (env.REFRESH_TOKEN_EXPIRY || '7d') as any,
  };
  return sign({ ...payload, type: 'refresh' }, env.REFRESH_TOKEN_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return verify(token, env.ACCESS_TOKEN_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return verify(token, env.REFRESH_TOKEN_SECRET) as TokenPayload;
};
