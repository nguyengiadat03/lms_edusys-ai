import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
import { sendEmail } from './emailService';

const prisma = new PrismaClient();

export class AdvancedAuthService {
  /**
   * Gửi email reset password
   */
  static async sendPasswordResetEmail(email: string) {
    try {
      const user = await prisma.users.findFirst({
        where: { 
          email: email.toLowerCase(),
          is_active: true
        }
      });

      if (!user) {
        // Don't reveal if email exists
        return { success: true };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      await prisma.password_reset_tokens.create({
        data: {
          user_id: user.id,
          token: resetToken,
          expires_at: resetTokenExpiry
        }
      });

      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset mật khẩu - EduSys AI',
        template: 'password-reset',
        data: {
          name: user.full_name,
          resetUrl,
          expiryTime: '1 giờ'
        }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Lỗi khi gửi email reset password: ${error.message}`);
    }
  }

  /**
   * Reset password với token
   */
  static async resetPassword(token: string, newPassword: string) {
    try {
      // Find valid reset token
      const resetToken = await prisma.password_reset_tokens.findFirst({
        where: {
          token,
          expires_at: { gte: new Date() },
          used_at: null
        },
        include: {
          users: true
        }
      });

      if (!resetToken) {
        throw new Error('Token không hợp lệ hoặc đã hết hạn');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password and mark token as used
      await prisma.$transaction([
        prisma.users.update({
          where: { id: resetToken.user_id },
          data: { 
            password_hash: hashedPassword,
            password_changed_at: new Date()
          }
        }),
        prisma.password_reset_tokens.update({
          where: { id: resetToken.id },
          data: { used_at: new Date() }
        })
      ]);

      return { success: true };
    } catch (error) {
      throw new Error(`Lỗi khi reset password: ${error.message}`);
    }
  }

  /**
   * Thay đổi password
   */
  static async changePassword(userId: bigint, currentPassword: string, newPassword: string) {
    try {
      // Get current user
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Không tìm thấy người dùng');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Mật khẩu hiện tại không đúng');
      }

      // Check if new password is different
      const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
      if (isSamePassword) {
        throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.users.update({
        where: { id: userId },
        data: { 
          password_hash: hashedPassword,
          password_changed_at: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Lỗi khi thay đổi password: ${error.message}`);
    }
  }

  /**
   * Thiết lập MFA
   */
  static async setupMFA(userId: bigint, userEmail: string) {
    try {
      // Check if MFA is already enabled
      const existingMfa = await prisma.user_mfa_settings.findUnique({
        where: { user_id: userId }
      });

      if (existingMfa && existingMfa.is_enabled) {
        throw new Error('MFA đã được kích hoạt cho tài khoản này');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `EduSys AI (${userEmail})`,
        issuer: 'EduSys AI'
      });

      // Save MFA settings (not enabled yet)
      await prisma.user_mfa_settings.upsert({
        where: { user_id: userId },
        update: {
          secret_key: secret.base32,
          is_enabled: false,
          backup_codes: JSON.stringify([])
        },
        create: {
          user_id: userId,
          secret_key: secret.base32,
          is_enabled: false,
          backup_codes: JSON.stringify([])
        }
      });

      return {
        secret: secret.base32,
        otpauth_url: secret.otpauth_url
      };
    } catch (error) {
      throw new Error(`Lỗi khi thiết lập MFA: ${error.message}`);
    }
  }

  /**
   * Xác thực và kích hoạt MFA
   */
  static async verifyAndEnableMFA(userId: bigint, token: string) {
    try {
      // Get MFA settings
      const mfaSettings = await prisma.user_mfa_settings.findUnique({
        where: { user_id: userId }
      });

      if (!mfaSettings || !mfaSettings.secret_key) {
        throw new Error('MFA chưa được thiết lập');
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: mfaSettings.secret_key,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        throw new Error('Mã xác thực không đúng');
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );

      // Enable MFA
      await prisma.user_mfa_settings.update({
        where: { user_id: userId },
        data: {
          is_enabled: true,
          backup_codes: JSON.stringify(backupCodes),
          enabled_at: new Date()
        }
      });

      return { backupCodes };
    } catch (error) {
      throw new Error(`Lỗi khi xác thực MFA: ${error.message}`);
    }
  }

  /**
   * Tắt MFA
   */
  static async disableMFA(userId: bigint, password: string) {
    try {
      // Verify password
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Không tìm thấy người dùng');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Mật khẩu không đúng');
      }

      // Disable MFA
      await prisma.user_mfa_settings.update({
        where: { user_id: userId },
        data: {
          is_enabled: false,
          disabled_at: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Lỗi khi tắt MFA: ${error.message}`);
    }
  }

  /**
   * Xác thực MFA token
   */
  static async verifyMFAToken(userId: bigint, token: string) {
    try {
      const mfaSettings = await prisma.user_mfa_settings.findUnique({
        where: { 
          user_id: userId,
          is_enabled: true
        }
      });

      if (!mfaSettings) {
        return false;
      }

      // Try TOTP first
      const verified = speakeasy.totp.verify({
        secret: mfaSettings.secret_key,
        encoding: 'base32',
        token,
        window: 2
      });

      if (verified) {
        return true;
      }

      // Try backup codes
      const backupCodes = JSON.parse(mfaSettings.backup_codes || '[]');
      const codeIndex = backupCodes.indexOf(token.toUpperCase());
      
      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await prisma.user_mfa_settings.update({
          where: { user_id: userId },
          data: { backup_codes: JSON.stringify(backupCodes) }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  }

  /**
   * Lấy danh sách sessions của user
   */
  static async getUserSessions(userId: bigint) {
    try {
      const sessions = await prisma.user_sessions.findMany({
        where: {
          user_id: userId,
          expires_at: { gte: new Date() },
          is_active: true
        },
        orderBy: { last_activity_at: 'desc' },
        select: {
          id: true,
          device_info: true,
          ip_address: true,
          user_agent: true,
          created_at: true,
          last_activity_at: true,
          is_current: true
        }
      });

      return sessions;
    } catch (error) {
      throw new Error(`Lỗi khi lấy sessions: ${error.message}`);
    }
  }

  /**
   * Xóa session
   */
  static async deleteSession(sessionId: bigint, userId: bigint) {
    try {
      // Check if session belongs to user
      const session = await prisma.user_sessions.findFirst({
        where: {
          id: sessionId,
          user_id: userId
        }
      });

      if (!session) {
        throw new Error('Không tìm thấy session');
      }

      // Deactivate session
      await prisma.user_sessions.update({
        where: { id: sessionId },
        data: {
          is_active: false,
          ended_at: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Lỗi khi xóa session: ${error.message}`);
    }
  }

  /**
   * Lấy permissions của user
   */
  static async getUserPermissions(userId: bigint) {
    try {
      // Get user roles and their permissions
      const userRoles = await prisma.user_roles.findMany({
        where: { user_id: userId },
        include: {
          roles: {
            include: {
              role_permissions: {
                include: {
                  permissions: true
                }
              }
            }
          }
        }
      });

      // Flatten permissions
      const permissions = userRoles.flatMap(ur => 
        ur.roles.role_permissions.map(rp => ({
          id: rp.permissions.id,
          name: rp.permissions.name,
          resource: rp.permissions.resource,
          action: rp.permissions.action,
          role: ur.roles.name
        }))
      );

      // Remove duplicates
      const uniquePermissions = permissions.filter((permission, index, self) =>
        index === self.findIndex(p => p.id === permission.id)
      );

      return uniquePermissions;
    } catch (error) {
      throw new Error(`Lỗi khi lấy permissions: ${error.message}`);
    }
  }

  /**
   * Lấy roles của user
   */
  static async getUserRoles(userId: bigint) {
    try {
      const userRoles = await prisma.user_roles.findMany({
        where: { user_id: userId },
        include: {
          roles: true,
          campuses: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      return userRoles.map(ur => ({
        id: ur.roles.id,
        name: ur.roles.name,
        description: ur.roles.description,
        campus: ur.campuses,
        assigned_at: ur.created_at
      }));
    } catch (error) {
      throw new Error(`Lỗi khi lấy roles: ${error.message}`);
    }
  }

  /**
   * Impersonate user
   */
  static async impersonateUser(adminUserId: bigint, targetUserId: bigint, ipAddress?: string, userAgent?: string) {
    try {
      // Get target user
      const targetUser = await prisma.users.findUnique({
        where: { 
          id: targetUserId,
          is_active: true
        }
      });

      if (!targetUser) {
        throw new Error('Không tìm thấy user để impersonate');
      }

      // Cannot impersonate super admin
      if (targetUser.role === 'super_admin') {
        throw new Error('Không thể impersonate super admin');
      }

      // Generate impersonation token
      const impersonationToken = jwt.sign(
        {
          userId: targetUser.id.toString(),
          impersonatedBy: adminUserId.toString(),
          type: 'impersonation'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Log impersonation
      await prisma.user_impersonations.create({
        data: {
          admin_user_id: adminUserId,
          target_user_id: targetUserId,
          started_at: new Date(),
          ip_address: ipAddress,
          user_agent: userAgent
        }
      });

      return {
        token: impersonationToken,
        target_user: {
          id: targetUser.id,
          email: targetUser.email,
          full_name: targetUser.full_name,
          role: targetUser.role
        },
        expires_in: 3600
      };
    } catch (error) {
      throw new Error(`Lỗi khi impersonate user: ${error.message}`);
    }
  }

  /**
   * Bulk import users
   */
  static async bulkImportUsers(users: any[], tenantId: bigint) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const userData of users) {
        try {
          // Check if user already exists
          const existingUser = await prisma.users.findFirst({
            where: {
              email: userData.email.toLowerCase(),
              tenant_id: tenantId
            }
          });

          if (existingUser) {
            results.failed++;
            results.errors.push({
              email: userData.email,
              error: 'User đã tồn tại'
            });
            continue;
          }

          // Generate temporary password
          const tempPassword = crypto.randomBytes(8).toString('hex');
          const hashedPassword = await bcrypt.hash(tempPassword, 12);

          // Create user
          const newUser = await prisma.users.create({
            data: {
              tenant_id: tenantId,
              email: userData.email.toLowerCase(),
              full_name: userData.full_name,
              role: userData.role,
              campus_id: userData.campus_id,
              password_hash: hashedPassword,
              is_active: true,
              email_verified: false,
              must_change_password: true
            }
          });

          // Send welcome email with temporary password
          await sendEmail({
            to: newUser.email,
            subject: 'Chào mừng đến với EduSys AI',
            template: 'welcome-user',
            data: {
              name: newUser.full_name,
              email: newUser.email,
              tempPassword,
              loginUrl: `${process.env.FRONTEND_URL}/login`
            }
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            email: userData.email,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Lỗi khi bulk import users: ${error.message}`);
    }
  }

  /**
   * Bulk update users
   */
  static async bulkUpdateUsers(userIds: bigint[], updates: any, tenantId: bigint) {
    try {
      // Validate users belong to tenant
      const users = await prisma.users.findMany({
        where: {
          id: { in: userIds },
          tenant_id: tenantId
        }
      });

      if (users.length !== userIds.length) {
        throw new Error('Một số user không tồn tại hoặc không thuộc tenant này');
      }

      // Update users
      const result = await prisma.users.updateMany({
        where: {
          id: { in: userIds },
          tenant_id: tenantId
        },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });

      return { updated_count: result.count };
    } catch (error) {
      throw new Error(`Lỗi khi bulk update users: ${error.message}`);
    }
  }

  /**
   * Lấy audit logs của user
   */
  static async getUserAuditLogs(userId: bigint, page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.audit_logs.findMany({
          where: { actor_id: userId },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit
        }),
        prisma.audit_logs.count({
          where: { actor_id: userId }
        })
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy audit logs: ${error.message}`);
    }
  }

  /**
   * Cleanup expired tokens
   */
  static async cleanupExpiredTokens() {
    try {
      const now = new Date();

      // Cleanup expired password reset tokens
      await prisma.password_reset_tokens.deleteMany({
        where: {
          expires_at: { lt: now }
        }
      });

      // Cleanup expired sessions
      await prisma.user_sessions.updateMany({
        where: {
          expires_at: { lt: now },
          is_active: true
        },
        data: {
          is_active: false,
          ended_at: now
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Cleanup expired tokens error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default AdvancedAuthService;