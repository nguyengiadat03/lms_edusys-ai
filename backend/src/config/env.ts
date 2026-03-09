import dotenv from 'dotenv';

dotenv.config();

export type AppEnvironment = 'development' | 'test' | 'production';

export const NODE_ENV = (process.env.NODE_ENV as AppEnvironment) || 'development';

export const isProduction = NODE_ENV === 'production';
export const isDevelopment = NODE_ENV === 'development';
export const isTest = NODE_ENV === 'test';

export const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const validateEnv = (): void => {
  // Disallow unsafe flags in production
  if (isProduction && process.env.SKIP_AUTH === 'true') {
    throw new Error('SKIP_AUTH must not be enabled in production');
  }

  // Require strong JWT secret in production
  if (isProduction) {
    getRequiredEnv('JWT_SECRET');
  }

  // Optional: enforce DB password in production environments
  if (isProduction && (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === '')) {
    throw new Error('DB_PASSWORD is required in production');
  }
};

// Parse comma-separated CORS origins
export const getAllowedOrigins = (): string[] => {
  const fromEnv = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const legacy = (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []);
  return [...new Set([...fromEnv, ...legacy])];
};

