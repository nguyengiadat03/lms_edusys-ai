-- Certificates issuance and verification

CREATE TABLE IF NOT EXISTS certificate_templates (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  template_json JSON NULL COMMENT 'Layout config (texts, positions, fonts)',
  background_document_id BIGINT UNSIGNED NULL,
  signatory_names JSON NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (background_document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  UNIQUE KEY uk_cert_tpl_tenant_code (tenant_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificate_issuances (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  template_id BIGINT UNSIGNED NOT NULL,
  verification_token VARCHAR(64) NOT NULL,
  document_id BIGINT UNSIGNED NULL COMMENT 'Generated PDF stored as document',
  issue_date DATE NOT NULL,
  status ENUM('pending','issued','revoked') NOT NULL DEFAULT 'issued',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES certificate_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  UNIQUE KEY uk_cert_token (verification_token),
  INDEX idx_ci_student (student_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificate_verifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  issuance_id BIGINT UNSIGNED NOT NULL,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  outcome ENUM('valid','invalid','revoked') DEFAULT 'valid',
  metadata JSON NULL,
  FOREIGN KEY (issuance_id) REFERENCES certificate_issuances(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_cv_iss (issuance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

