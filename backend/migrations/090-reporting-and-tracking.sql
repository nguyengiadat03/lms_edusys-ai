-- Reporting & Learning Progress Tracking

CREATE TABLE IF NOT EXISTS learning_progress (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  unit_id BIGINT UNSIGNED NULL,
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (unit_id) REFERENCES unit_blueprints(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_lp_student_class (student_user_id, class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS completion_tracking (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  item_type ENUM('unit','assignment','assessment','session') NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'in_progress',
  completed_at TIMESTAMP NULL,
  UNIQUE KEY uk_completion_item (student_user_id, item_type, item_id),
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ct_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional materialized summaries for fast reporting
CREATE TABLE IF NOT EXISTS attendance_summary (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  sessions_attended INT UNSIGNED DEFAULT 0,
  sessions_total INT UNSIGNED DEFAULT 0,
  attendance_rate DECIMAL(6,3) GENERATED ALWAYS AS (
    CASE WHEN sessions_total > 0 THEN sessions_attended / sessions_total ELSE 0 END
  ) STORED,
  last_calculated_at TIMESTAMP NULL,
  UNIQUE KEY uk_attendance_summary (class_id, student_user_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grade_summary (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  average_score DECIMAL(8,2) NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_grade_summary (class_id, student_user_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

