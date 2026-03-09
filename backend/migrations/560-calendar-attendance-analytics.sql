-- Analytics: punctuality metrics, staff and teacher summaries (optional materialized)

CREATE TABLE IF NOT EXISTS punctuality_metrics (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NULL,
  class_session_id BIGINT UNSIGNED NULL,
  on_time_rate DECIMAL(6,3) NULL,
  late_rate DECIMAL(6,3) NULL,
  absent_rate DECIMAL(6,3) NULL,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_pm_class (class_id),
  INDEX idx_pm_session (class_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_timesheets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  shifts_count INT UNSIGNED DEFAULT 0,
  hours_worked DECIMAL(8,2) DEFAULT 0.00,
  late_count INT UNSIGNED DEFAULT 0,
  absent_count INT UNSIGNED DEFAULT 0,
  approved_by BIGINT UNSIGNED NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sts_period (user_id, period_start, period_end),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

