import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Encryption utilities for sensitive data
export class Encryption {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(secret: string) {
    const salt = 'orderly-saas-salt';
    this.key = scryptSync(secret, salt, 32);
  }

  encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

// Mask sensitive data for logging
export const maskSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'passwordHash',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'apiSecret',
    'creditCard',
    'cardNumber',
    'cvv',
    'cvc',
    'ssn',
    'socialSecurity',
  ];

  const masked = { ...data };

  for (const key of Object.keys(masked)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '*****';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
};