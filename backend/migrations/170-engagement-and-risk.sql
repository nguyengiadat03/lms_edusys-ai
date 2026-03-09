-- Engagement metrics and dropout risk flags

CREATE TABLE IF NOT EXISTS activity_participation (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_session_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  participation_type ENUM('activity','speak','submit','answer','group','other') NOT NULL DEFAULT 'activity',
  reference_id BIGINT UNSIGNED NULL,
  score DECIMAL(6,2) NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ap_session_student (class_session_id, student_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dropout_risk_flags (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  student_user_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  risk_level ENUM('low','medium','high','critical') NOT NULL DEFAULT 'low',
  factors JSON NULL,
  status ENUM('open','resolved') NOT NULL DEFAULT 'open',
  flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_drf_student_class (student_user_id, class_id),
  INDEX idx_drf_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

