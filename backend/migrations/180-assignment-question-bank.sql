-- Assignment Question Bank normalization

CREATE TABLE IF NOT EXISTS assignment_passages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('reading','listening','prompt','other') NOT NULL DEFAULT 'reading',
  title VARCHAR(255) NULL,
  content LONGTEXT NULL,
  document_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ap_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_questions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT UNSIGNED NOT NULL,
  type ENUM('mcq','true_false','matching','essay','short_answer','audio','speaking','reading') NOT NULL,
  stem TEXT NULL,
  passage_id BIGINT UNSIGNED NULL,
  points DECIMAL(8,2) DEFAULT 1.0,
  difficulty VARCHAR(16) NULL,
  metadata JSON NULL,
  order_index INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (passage_id) REFERENCES assignment_passages(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_aq_assignment (assignment_id),
  INDEX idx_aq_passage (passage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_question_options (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(16) NULL,
  content TEXT NULL,
  is_correct TINYINT(1) DEFAULT 0,
  points DECIMAL(8,2) NULL,
  order_index INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES assignment_questions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_aqo_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_question_media (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('image','audio','video','document','other') NOT NULL DEFAULT 'image',
  document_id BIGINT UNSIGNED NULL,
  url TEXT NULL,
  notes VARCHAR(255) NULL,
  FOREIGN KEY (question_id) REFERENCES assignment_questions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_aqm_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
