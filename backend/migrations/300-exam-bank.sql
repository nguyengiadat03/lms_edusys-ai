-- Exam Bank: blueprints, versions, sections, items, tags, attachments

CREATE TABLE IF NOT EXISTS exam_blueprints (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  exam_type ENUM('placement','quiz','mid','final','mock','other') NOT NULL DEFAULT 'quiz',
  level VARCHAR(32) NULL,
  skill VARCHAR(64) NULL,
  subject VARCHAR(64) NULL,
  description TEXT NULL,
  owner_user_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  UNIQUE KEY uk_exam_blueprint_code (tenant_id, code),
  INDEX idx_exam_bp_tenant (tenant_id),
  INDEX idx_exam_bp_type (exam_type),
  INDEX idx_exam_bp_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_versions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  blueprint_id BIGINT UNSIGNED NOT NULL,
  version_no VARCHAR(32) NOT NULL,
  state ENUM('draft','approved','published','archived') NOT NULL DEFAULT 'draft',
  notes TEXT NULL,
  is_latest TINYINT(1) DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (blueprint_id) REFERENCES exam_blueprints(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  UNIQUE KEY uk_exam_version (blueprint_id, version_no),
  INDEX idx_exam_ver_bp (blueprint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_sections (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  version_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NULL,
  section_type ENUM('listening','reading','writing','speaking','mixed') NOT NULL DEFAULT 'mixed',
  time_limit_minutes INT UNSIGNED NULL,
  order_index INT UNSIGNED DEFAULT 0,
  instructions TEXT NULL,

  FOREIGN KEY (version_id) REFERENCES exam_versions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_exam_sections_ver (version_id),
  INDEX idx_exam_sections_order (version_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  section_id BIGINT UNSIGNED NOT NULL,
  item_type ENUM('question','task','passage') NOT NULL DEFAULT 'question',
  title VARCHAR(255) NULL,
  points DECIMAL(8,2) NOT NULL DEFAULT 1.00,
  order_index INT UNSIGNED DEFAULT 0,
  question_id BIGINT UNSIGNED NULL,
  passage_id BIGINT UNSIGNED NULL,
  payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (section_id) REFERENCES exam_sections(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES assignment_questions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (passage_id) REFERENCES assignment_passages(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_exam_items_section (section_id),
  INDEX idx_exam_items_order (section_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_blueprint_tags (
  blueprint_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (blueprint_id, tag_id),
  FOREIGN KEY (blueprint_id) REFERENCES exam_blueprints(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_blueprint_attachments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  blueprint_id BIGINT UNSIGNED NOT NULL,
  document_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blueprint_id) REFERENCES exam_blueprints(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_eba_bp (blueprint_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
