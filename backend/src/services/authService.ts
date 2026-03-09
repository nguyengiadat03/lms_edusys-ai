import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { createError } from '../middleware/errorHandler';

export interface User {
  id: bigint;
  tenant_id: bigint;
  email: string;
  full_name: string;
  role: string;
  campus_id?: bigint | null;
  is_active: boolean;
  last_login_at?: Date | null;
  preferences?: any;
  mfa_secret?: string | null;
  mfa_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    tenant_id: number;
    campus_id?: number | null;
  };
}

export class AuthService {
  private generateToken(userId: bigint): string {
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    return jwt.sign(
      { userId: userId.toString(), type: 'access' },
      secret,
      { expiresIn } as any
    );
  }

  private generateRefreshToken(userId: bigint): string {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production';

    return jwt.sign(
      { userId: userId.toString(), type: 'refresh' },
      secret,
      { expiresIn: '7d' }
    );
  }

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { email, password } = credentials;

    const user = await prisma.users.findFirst({
      where: {
        email,
        deleted_at: null
      }
    });

    if (!user) {
      throw createError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    if (!user.is_active) {
      throw createError('Account is disabled', 'ACCOUNT_DISABLED', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash || '');
    if (!isValidPassword) {
      throw createError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    const accessToken = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 86400, // 24 hours
      user: {
        id: Number(user.id),
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        tenant_id: Number(user.tenant_id),
        campus_id: user.campus_id ? Number(user.campus_id) : null
      }
    };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    try {
      const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'default-secret-change-in-production';
      const decoded = jwt.verify(refreshToken, secret) as any;

      if (decoded.type !== 'refresh') {
        throw createError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
      }

      const user = await prisma.users.findFirst({
        where: {
          id: BigInt(decoded.userId),
          is_active: true
        }
      });

      if (!user) {
        throw createError('User not found', 'USER_NOT_FOUND', 401);
      }

      const accessToken = this.generateToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: 86400
      };
    } catch (error) {
      throw createError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }
  }

  async getCurrentUser(userId: bigint): Promise<User> {
    const user = await prisma.users.findFirst({
      where: { id: userId }
    });

    if (!user) {
      throw createError('User not found', 'USER_NOT_FOUND', 404);
    }

    return {
      id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      campus_id: user.campus_id,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      preferences: user.preferences,
      mfa_secret: user.mfa_secret,
      mfa_enabled: user.mfa_enabled,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  async verifyMFA(userId: bigint, code: string): Promise<{ message: string }> {
    const user = await prisma.users.findFirst({
      where: { id: userId }
    });

    if (!user || !user.mfa_secret) {
      throw createError('MFA not configured for this user', 'MFA_NOT_CONFIGURED', 400);
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow 2 time steps tolerance
    });

    if (!isValid) {
      throw createError('Invalid MFA code', 'INVALID_MFA_CODE', 401);
    }

    return { message: 'MFA verified successfully' };
  }
}

export const authService = new AuthService();