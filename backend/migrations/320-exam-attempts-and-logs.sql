-- Exam Attempts, items, answer events, uploads, timers

CREATE TABLE IF NOT EXISTS exam_attempts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exam_event_id BIGINT UNSIGNED NOT NULL,
  exam_version_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  attempt_no INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('not_started','in_progress','submitted','graded','void') NOT NULL DEFAULT 'not_started',
  started_at DATETIME NULL,
  submitted_at DATETIME NULL,
  duration_seconds INT UNSIGNED NULL,
  score DECIMAL(8,2) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_attempt_unique (exam_event_id, student_user_id, attempt_no),
  FOREIGN KEY (exam_event_id) REFERENCES exam_events(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (exam_version_id) REFERENCES exam_versions(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_attempt_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_attempt_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attempt_id BIGINT UNSIGNED NOT NULL,
  exam_item_id BIGINT UNSIGNED NOT NULL,
  answer_json JSON NULL,
  score DECIMAL(8,2) NULL,
  graded_by BIGINT UNSIGNED NULL,
  graded_at DATETIME NULL,
  UNIQUE KEY uk_attempt_item (attempt_id, exam_item_id),
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (exam_item_id) REFERENCES exam_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_answer_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attempt_id BIGINT UNSIGNED NOT NULL,
  exam_item_id BIGINT UNSIGNED NULL,
  event_type ENUM('autosave','answer_change','flag','unflag') NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (exam_item_id) REFERENCES exam_items(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_eae_attempt (attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_uploads (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attempt_id BIGINT UNSIGNED NOT NULL,
  exam_item_id BIGINT UNSIGNED NULL,
  document_id BIGINT UNSIGNED NULL,
  url TEXT NULL,
  mime_type VARCHAR(128) NULL,
  file_size BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (exam_item_id) REFERENCES exam_items(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_eu_attempt (attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_timer_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  attempt_id BIGINT UNSIGNED NOT NULL,
  event ENUM('start','pause','resume','submit','extend') NOT NULL,
  delta_seconds INT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ete_attempt (attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

