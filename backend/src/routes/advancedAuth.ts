import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { auditLog, logAuthAction } from '../middleware/auditLog';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { sendEmail } from '../services/emailService';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số')
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  new_password: z.string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu mới phải có ít nhất 1 chữ thường, 1 chữ hoa và 1 số')
});

const mfaVerifySchema = z.object({
  token: z.string().length(6, 'Mã xác thực phải có 6 chữ số')
});

const impersonateSchema = z.object({
  user_id: z.string().transform(val => BigInt(val))
});

const bulkImportSchema = z.object({
  users: z.array(z.object({
    email: z.string().email(),
    full_name: z.string().min(1),
    role: z.string().min(1),
    campus_id: z.string().optional().transform(val => val ? BigInt(val) : undefined)
  }))
});

const bulkUpdateSchema = z.object({
  user_ids: z.array(z.string().transform(val => BigInt(val))),
  updates: z.object({
    role: z.string().optional(),
    is_active: z.boolean().optional(),
    campus_id: z.string().optional().transform(val => val ? BigInt(val) : undefined)
  })
});

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Gửi email quên mật khẩu
 *     tags: [Advanced Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email reset password đã được gửi
 */
router.post('/forgot-password', 
  validateRequest(forgotPasswordSchema),
  logAuthAction('FORGOT_PASSWORD'),
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await prisma.users.findFirst({
        where: { 
          email: email.toLowerCase(),
          is_active: true
        }
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn reset mật khẩu'
        });
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

      res.json({
        success: true,
        message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn reset mật khẩu'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý yêu cầu reset mật khẩu',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset mật khẩu với token
 *     tags: [Advanced Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mật khẩu đã được reset thành công
 */
router.post('/reset-password',
  validateRequest(resetPasswordSchema),
  logAuthAction('RESET_PASSWORD'),
  async (req, res) => {
    try {
      const { token, password } = req.body;

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
        return res.status(400).json({
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

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

      res.json({
        success: true,
        message: 'Mật khẩu đã được reset thành công'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi reset mật khẩu',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu hiện tại
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mật khẩu đã được thay đổi thành công
 */
router.post('/change-password',
  authenticateToken,
  validateRequest(changePasswordSchema),
  auditLog('user', 'change_password'),
  async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.id;

      // Get current user
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      // Check if new password is different
      const isSamePassword = await bcrypt.compare(new_password, user.password_hash);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải khác mật khẩu hiện tại'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 12);

      // Update password
      await prisma.users.update({
        where: { id: userId },
        data: { 
          password_hash: hashedPassword,
          password_changed_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Mật khẩu đã được thay đổi thành công'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thay đổi mật khẩu',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/mfa/setup:
 *   post:
 *     summary: Thiết lập MFA (TOTP)
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA setup thành công
 */
router.post('/mfa/setup',
  authenticateToken,
  auditLog('user', 'mfa_setup'),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Check if MFA is already enabled
      const existingMfa = await prisma.user_mfa_settings.findUnique({
        where: { user_id: userId }
      });

      if (existingMfa && existingMfa.is_enabled) {
        return res.status(400).json({
          success: false,
          message: 'MFA đã được kích hoạt cho tài khoản này'
        });
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `EduSys AI (${req.user.email})`,
        issuer: 'EduSys AI'
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

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

      res.json({
        success: true,
        message: 'MFA setup đã được khởi tạo',
        data: {
          secret: secret.base32,
          qr_code: qrCodeUrl,
          manual_entry_key: secret.base32,
          instructions: 'Quét mã QR hoặc nhập key thủ công vào ứng dụng authenticator, sau đó xác thực để hoàn tất thiết lập'
        }
      });
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi thiết lập MFA',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/mfa/verify:
 *   post:
 *     summary: Xác thực và kích hoạt MFA
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA đã được kích hoạt thành công
 */
router.post('/mfa/verify',
  authenticateToken,
  validateRequest(mfaVerifySchema),
  auditLog('user', 'mfa_verify'),
  async (req, res) => {
    try {
      const { token } = req.body;
      const userId = req.user.id;

      // Get MFA settings
      const mfaSettings = await prisma.user_mfa_settings.findUnique({
        where: { user_id: userId }
      });

      if (!mfaSettings || !mfaSettings.secret_key) {
        return res.status(400).json({
          success: false,
          message: 'MFA chưa được thiết lập'
        });
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: mfaSettings.secret_key,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({
          success: false,
          message: 'Mã xác thực không đúng'
        });
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

      res.json({
        success: true,
        message: 'MFA đã được kích hoạt thành công',
        data: {
          backup_codes: backupCodes,
          message: 'Vui lòng lưu trữ các mã backup này ở nơi an toàn'
        }
      });
    } catch (error) {
      console.error('MFA verify error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xác thực MFA',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/mfa/disable:
 *   post:
 *     summary: Tắt MFA
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA đã được tắt thành công
 */
router.post('/mfa/disable',
  authenticateToken,
  auditLog('user', 'mfa_disable'),
  async (req, res) => {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      // Verify password
      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu không đúng'
        });
      }

      // Disable MFA
      await prisma.user_mfa_settings.update({
        where: { user_id: userId },
        data: {
          is_enabled: false,
          disabled_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'MFA đã được tắt thành công'
      });
    } catch (error) {
      console.error('MFA disable error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tắt MFA',
        error: error.message
      });
    }
  }
);

export default router;/**
 *
 @swagger
 * /api/v1/auth/sessions:
 *   get:
 *     summary: Danh sách sessions hoạt động
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sessions
 */
router.get('/sessions',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;

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

      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách sessions',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/sessions/{id}:
 *   delete:
 *     summary: Xóa session cụ thể
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session đã được xóa
 */
router.delete('/sessions/:id',
  authenticateToken,
  auditLog('user_session', 'delete'),
  async (req, res) => {
    try {
      const sessionId = BigInt(req.params.id);
      const userId = req.user.id;

      // Check if session belongs to user
      const session = await prisma.user_sessions.findFirst({
        where: {
          id: sessionId,
          user_id: userId
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy session'
        });
      }

      // Deactivate session
      await prisma.user_sessions.update({
        where: { id: sessionId },
        data: {
          is_active: false,
          ended_at: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Session đã được xóa thành công'
      });
    } catch (error) {
      console.error('Delete session error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa session',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}/permissions:
 *   get:
 *     summary: Lấy permissions của user
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách permissions
 */
router.get('/users/:id/permissions',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const userId = BigInt(req.params.id);

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

      res.json({
        success: true,
        data: uniquePermissions
      });
    } catch (error) {
      console.error('Get user permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy permissions của user',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}/roles:
 *   get:
 *     summary: Lấy roles của user
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách roles
 */
router.get('/users/:id/roles',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const userId = BigInt(req.params.id);

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

      res.json({
        success: true,
        data: userRoles.map(ur => ({
          id: ur.roles.id,
          name: ur.roles.name,
          description: ur.roles.description,
          campus: ur.campuses,
          assigned_at: ur.created_at
        }))
      });
    } catch (error) {
      console.error('Get user roles error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy roles của user',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}/impersonate:
 *   post:
 *     summary: Impersonate user (admin only)
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Impersonation token
 */
router.post('/users/:id/impersonate',
  authenticateToken,
  requireRole(['super_admin']),
  auditLog('user', 'impersonate'),
  async (req, res) => {
    try {
      const targetUserId = BigInt(req.params.id);
      const adminUserId = req.user.id;

      // Get target user
      const targetUser = await prisma.users.findUnique({
        where: { 
          id: targetUserId,
          is_active: true
        }
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy user để impersonate'
        });
      }

      // Cannot impersonate super admin
      if (targetUser.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Không thể impersonate super admin'
        });
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
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        }
      });

      res.json({
        success: true,
        message: 'Impersonation token được tạo thành công',
        data: {
          token: impersonationToken,
          target_user: {
            id: targetUser.id,
            email: targetUser.email,
            full_name: targetUser.full_name,
            role: targetUser.role
          },
          expires_in: 3600
        }
      });
    } catch (error) {
      console.error('Impersonate user error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi impersonate user',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/bulk-import:
 *   post:
 *     summary: Import users từ CSV
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     campus_id:
 *                       type: string
 *     responses:
 *       200:
 *         description: Users imported thành công
 */
router.post('/users/bulk-import',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  validateRequest(bulkImportSchema),
  auditLog('user', 'bulk_import'),
  async (req, res) => {
    try {
      const { users } = req.body;
      const tenantId = req.user.tenant_id;

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

      res.json({
        success: true,
        message: `Import hoàn tất: ${results.success} thành công, ${results.failed} thất bại`,
        data: results
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi import users',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/bulk-update:
 *   post:
 *     summary: Cập nhật hàng loạt users
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_ids
 *               - updates
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               updates:
 *                 type: object
 *                 properties:
 *                   role:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 *                   campus_id:
 *                     type: string
 *     responses:
 *       200:
 *         description: Users updated thành công
 */
router.post('/users/bulk-update',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  validateRequest(bulkUpdateSchema),
  auditLog('user', 'bulk_update'),
  async (req, res) => {
    try {
      const { user_ids, updates } = req.body;
      const tenantId = req.user.tenant_id;

      // Validate users belong to tenant
      const users = await prisma.users.findMany({
        where: {
          id: { in: user_ids },
          tenant_id: tenantId
        }
      });

      if (users.length !== user_ids.length) {
        return res.status(400).json({
          success: false,
          message: 'Một số user không tồn tại hoặc không thuộc tenant này'
        });
      }

      // Update users
      const result = await prisma.users.updateMany({
        where: {
          id: { in: user_ids },
          tenant_id: tenantId
        },
        data: {
          ...updates,
          updated_at: new Date()
        }
      });

      res.json({
        success: true,
        message: `Đã cập nhật ${result.count} users thành công`,
        data: {
          updated_count: result.count
        }
      });
    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật users',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/users/{id}/audit-logs:
 *   get:
 *     summary: Audit logs của user
 *     tags: [Advanced Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Audit logs của user
 */
router.get('/users/:id/audit-logs',
  authenticateToken,
  requireRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const userId = BigInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
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

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get user audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy audit logs của user',
        error: error.message
      });
    }
  }
);

export default router;