-- Double marking and AI grading artifacts

CREATE TABLE IF NOT EXISTS grading_assignments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exam_attempt_id BIGINT UNSIGNED NOT NULL,
  grader_user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('primary','secondary','moderator') NOT NULL DEFAULT 'primary',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_grading_assign (exam_attempt_id, grader_user_id, role),
  FOREIGN KEY (exam_attempt_id) REFERENCES exam_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (grader_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grading_marks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attempt_item_id BIGINT UNSIGNED NOT NULL,
  rubric_criterion_id BIGINT UNSIGNED NULL,
  score DECIMAL(8,2) NULL,
  comment TEXT NULL,
  grader_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_item_id) REFERENCES exam_attempt_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (rubric_criterion_id) REFERENCES rubric_criteria(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (grader_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_gm_attempt_item (attempt_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grading_resolutions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exam_attempt_id BIGINT UNSIGNED NOT NULL,
  resolved_by BIGINT UNSIGNED NULL,
  final_score DECIMAL(8,2) NULL,
  resolution_notes TEXT NULL,
  resolved_at DATETIME NULL,
  FOREIGN KEY (exam_attempt_id) REFERENCES exam_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plagiarism_checks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attempt_item_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(64) NULL,
  status ENUM('queued','processing','complete','failed') NOT NULL DEFAULT 'queued',
  similarity_percent DECIMAL(5,2) NULL,
  report_url TEXT NULL,
  result_json JSON NULL,
  checked_at DATETIME NULL,
  FOREIGN KEY (attempt_item_id) REFERENCES exam_attempt_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_pc_attempt_item (attempt_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS speech_metrics (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attempt_item_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(64) NULL,
  fluency DECIMAL(6,2) NULL,
  pronunciation DECIMAL(6,2) NULL,
  grammar DECIMAL(6,2) NULL,
  words_per_minute DECIMAL(6,2) NULL,
  filler_count INT UNSIGNED NULL,
  result_json JSON NULL,
  analyzed_at DATETIME NULL,
  FOREIGN KEY (attempt_item_id) REFERENCES exam_attempt_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_sm_attempt_item (attempt_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

