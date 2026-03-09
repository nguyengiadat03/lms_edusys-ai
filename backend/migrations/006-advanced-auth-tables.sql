-- ===========================================
-- ADVANCED AUTH TABLES MIGRATION
-- Tạo các bảng cần thiết cho Advanced Authentication
-- Database: edusys_ai_2025_v1
-- ===========================================

USE `edusys_ai_2025_v1`;

-- ===========================================
-- PASSWORD RESET TOKENS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reset_token` (`token`),
  KEY `idx_reset_user` (`user_id`),
  KEY `idx_reset_expires` (`expires_at`),
  CONSTRAINT `fk_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- USER MFA SETTINGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS `user_mfa_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `secret_key` VARCHAR(255) NOT NULL,
  `is_enabled` BOOLEAN DEFAULT FALSE,
  `backup_codes` JSON NULL,
  `enabled_at` TIMESTAMP NULL DEFAULT NULL,
  `disabled_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mfa_user` (`user_id`),
  CONSTRAINT `fk_mfa_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- USER SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `session_token` VARCHAR(255) NOT NULL,
  `device_info` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_current` BOOLEAN DEFAULT FALSE,
  `expires_at` TIMESTAMP NOT NULL,
  `last_activity_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_session_token` (`session_token`),
  KEY `idx_session_user` (`user_id`),
  KEY `idx_session_active` (`is_active`, `expires_at`),
  KEY `idx_session_activity` (`last_activity_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- USER IMPERSONATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS `user_impersonations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_user_id` BIGINT UNSIGNED NOT NULL,
  `target_user_id` BIGINT UNSIGNED NOT NULL,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `reason` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_impersonation_admin` (`admin_user_id`),
  KEY `idx_impersonation_target` (`target_user_id`),
  KEY `idx_impersonation_time` (`started_at`),
  CONSTRAINT `fk_impersonation_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_impersonation_target` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- PERMISSIONS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `resource` VARCHAR(128) NOT NULL,
  `action` VARCHAR(128) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_resource_action` (`resource`, `action`),
  KEY `idx_permission_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- SCOPES TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `scopes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `permissions` JSON NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scope_name` (`name`),
  KEY `idx_scope_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- ROLE PERMISSIONS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_permission_role` (`role_id`),
  KEY `idx_role_permission_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- ADD MISSING COLUMNS TO USERS TABLE
-- ===========================================
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `password_changed_at` TIMESTAMP NULL DEFAULT NULL AFTER `password_hash`,
ADD COLUMN IF NOT EXISTS `must_change_password` BOOLEAN DEFAULT FALSE AFTER `password_changed_at`,
ADD COLUMN IF NOT EXISTS `email_verified` BOOLEAN DEFAULT FALSE AFTER `email`,
ADD COLUMN IF NOT EXISTS `email_verified_at` TIMESTAMP NULL DEFAULT NULL AFTER `email_verified`;

-- ===========================================
-- INSERT DEFAULT PERMISSIONS
-- ===========================================
INSERT IGNORE INTO `permissions` (`name`, `resource`, `action`, `description`) VALUES
-- System permissions
('system.info.read', 'system', 'info.read', 'Xem thông tin hệ thống'),
('system.stats.read', 'system', 'stats.read', 'Xem thống kê hệ thống'),
('system.maintenance.manage', 'system', 'maintenance.manage', 'Quản lý chế độ bảo trì'),
('system.logs.read', 'system', 'logs.read', 'Xem nhật ký hệ thống'),

-- Tenant permissions
('tenant.read', 'tenant', 'read', 'Xem thông tin tenant'),
('tenant.create', 'tenant', 'create', 'Tạo tenant mới'),
('tenant.update', 'tenant', 'update', 'Cập nhật tenant'),
('tenant.delete', 'tenant', 'delete', 'Xóa tenant'),

-- User permissions
('user.read', 'user', 'read', 'Xem thông tin user'),
('user.create', 'user', 'create', 'Tạo user mới'),
('user.update', 'user', 'update', 'Cập nhật user'),
('user.delete', 'user', 'delete', 'Xóa user'),
('user.impersonate', 'user', 'impersonate', 'Impersonate user'),
('user.bulk_import', 'user', 'bulk_import', 'Import hàng loạt user'),
('user.bulk_update', 'user', 'bulk_update', 'Cập nhật hàng loạt user'),

-- Auth permissions
('auth.mfa.setup', 'auth', 'mfa.setup', 'Thiết lập MFA'),
('auth.mfa.disable', 'auth', 'mfa.disable', 'Tắt MFA'),
('auth.sessions.manage', 'auth', 'sessions.manage', 'Quản lý sessions'),
('auth.password.reset', 'auth', 'password.reset', 'Reset mật khẩu'),

-- Audit permissions
('audit.read', 'audit', 'read', 'Xem audit logs'),
('audit.export', 'audit', 'export', 'Xuất audit logs'),

-- Settings permissions
('settings.read', 'settings', 'read', 'Xem cài đặt'),
('settings.update', 'settings', 'update', 'Cập nhật cài đặt'),

-- Notification permissions
('notification.read', 'notification', 'read', 'Xem thông báo'),
('notification.manage', 'notification', 'manage', 'Quản lý thông báo');

-- ===========================================
-- INSERT DEFAULT SCOPES
-- ===========================================
INSERT IGNORE INTO `scopes` (`name`, `description`, `permissions`) VALUES
('system_admin', 'Quản trị hệ thống', JSON_ARRAY(
  'system.info.read', 'system.stats.read', 'system.maintenance.manage', 'system.logs.read',
  'tenant.read', 'tenant.create', 'tenant.update', 'tenant.delete',
  'user.read', 'user.create', 'user.update', 'user.delete', 'user.impersonate', 'user.bulk_import', 'user.bulk_update',
  'audit.read', 'audit.export',
  'settings.read', 'settings.update',
  'notification.read', 'notification.manage'
)),
('tenant_admin', 'Quản trị tenant', JSON_ARRAY(
  'system.info.read', 'system.stats.read',
  'user.read', 'user.create', 'user.update', 'user.bulk_import', 'user.bulk_update',
  'audit.read',
  'settings.read', 'settings.update',
  'notification.read', 'notification.manage'
)),
('user_basic', 'Người dùng cơ bản', JSON_ARRAY(
  'auth.mfa.setup', 'auth.mfa.disable', 'auth.sessions.manage', 'auth.password.reset',
  'notification.read'
));

-- ===========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===========================================
ALTER TABLE `password_reset_tokens` 
ADD INDEX IF NOT EXISTS `idx_reset_token_user_expires` (`user_id`, `expires_at`);

ALTER TABLE `user_mfa_settings` 
ADD INDEX IF NOT EXISTS `idx_mfa_enabled` (`is_enabled`);

ALTER TABLE `user_sessions` 
ADD INDEX IF NOT EXISTS `idx_session_user_active` (`user_id`, `is_active`, `expires_at`);

ALTER TABLE `user_impersonations` 
ADD INDEX IF NOT EXISTS `idx_impersonation_admin_time` (`admin_user_id`, `started_at`);

-- ===========================================
-- VERIFY MIGRATION
-- ===========================================
SELECT '✅ ADVANCED AUTH TABLES MIGRATION COMPLETED!' AS status;

-- Show created tables
SELECT 
  TABLE_NAME as 'Table',
  TABLE_ROWS as 'Rows',
  ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'edusys_ai_2025_v1' 
  AND TABLE_NAME IN (
    'password_reset_tokens',
    'user_mfa_settings', 
    'user_sessions',
    'user_impersonations',
    'permissions',
    'scopes',
    'role_permissions'
  )
ORDER BY TABLE_NAME;