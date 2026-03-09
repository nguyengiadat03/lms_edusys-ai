-- Add MFA support to users table
ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255) NULL COMMENT 'TOTP secret for MFA';
ALTER TABLE users ADD COLUMN mfa_enabled TINYINT(1) DEFAULT 0 COMMENT 'Whether MFA is enabled for the user';