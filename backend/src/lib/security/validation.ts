// Password validation utilities
export const passwordValidation = {
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = { 
      minLength: 8,
      maxLength: 255,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    };

    if (password.length < config.minLength) {
      errors.push(`Password must be at least ${config.minLength} characters long`);
    }

    if (password.length > config.maxLength) {
      errors.push(`Password cannot exceed ${config.maxLength} characters`);
    }

    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  },

  sanitizePhone(phone: string): string {
    return phone.replace(/[^0-9+]/g, '').trim();
  },
};

// SQL injection prevention utilities
export const sqlInjectionPrevention = {
  // Check for SQL injection patterns
  hasSqlInjectionPattern(input: string): boolean {
    const sqlPatterns = [
      /(\bSELECT\b.*\bFROM\b)/i,
      /(\bINSERT\b.*\bINTO\b)/i,
      /(\bUPDATE\b.*\bSET\b)/i,
      /(\bDELETE\b.*\bFROM\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /(\bCREATE\b.*\bTABLE\b)/i,
      /(\bALTER\b.*\bTABLE\b)/i,
      /(\bUNION\b.*\bSELECT\b)/i,
      /(--)/,
      /('.*OR.*'='.*')/i,
      /('.*AND.*'='.*')/i,
      /('.*LIKE.*'%.*')/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  },

  // Sanitize string input
  sanitizeString(input: string): string {
    return input
      .replace(/['"]/g, '') // Remove quotes
      .replace(/--/g, '')   // Remove SQL comments
      .replace(/;/g, '')    // Remove semicolons
      .trim();
  },
};