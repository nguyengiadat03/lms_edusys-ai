-- Core Missing Tables
-- These tables are referenced by many other migrations but were missing

-- Classes table (referenced by many other tables)
CREATE TABLE IF NOT EXISTS classes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  campus_id BIGINT UNSIGNED NULL,
  course_blueprint_id BIGINT UNSIGNED NULL,
  code VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  level VARCHAR(64) NULL,
  language VARCHAR(32) NULL,
  max_students INT UNSIGNED DEFAULT 20,
  status ENUM('draft','active','completed','cancelled') DEFAULT 'draft',
  start_date DATE NULL,
  end_date DATE NULL,
  schedule JSON NULL COMMENT 'Class schedule information',
  room VARCHAR(100) NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (course_blueprint_id) REFERENCES course_blueprints(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  
  UNIQUE KEY uk_class_tenant_code (tenant_id, code),
  INDEX idx_classes_tenant (tenant_id),
  INDEX idx_classes_campus (campus_id),
  INDEX idx_classes_status (status),
  INDEX idx_classes_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documents table (referenced by document library and other features)
CREATE TABLE IF NOT EXISTS documents (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  file_path TEXT NULL,
  url TEXT NULL,
  mime_type VARCHAR(128) NULL,
  file_size BIGINT UNSIGNED NULL,
  ocr_text LONGTEXT NULL COMMENT 'OCR extracted text for search',
  ai_tags JSON NULL COMMENT 'Auto-generated tags',
  manual_tags JSON NULL COMMENT 'Manually added tags',
  health_status ENUM('healthy','broken','expired','restricted','unknown') DEFAULT 'unknown',
  last_health_check TIMESTAMP NULL,
  visibility ENUM('private','tenant','public') DEFAULT 'tenant',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  
  INDEX idx_doc_tenant (tenant_id),
  INDEX idx_doc_visibility (visibility),
  INDEX idx_doc_health (health_status),
  INDEX idx_doc_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Collections table (referenced by document sharing features)
CREATE TABLE IF NOT EXISTS document_collections (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_public TINYINT(1) DEFAULT 0,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  
  INDEX idx_doc_collections_tenant (tenant_id),
  INDEX idx_doc_collections_public (is_public),
  INDEX idx_doc_collections_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;