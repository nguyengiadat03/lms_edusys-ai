-- Teacher/TA attendance & timesheets and substitution requests

CREATE TABLE IF NOT EXISTS teacher_attendance (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_session_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('teacher','ta') NOT NULL DEFAULT 'teacher',
  check_in_at DATETIME NULL,
  check_out_at DATETIME NULL,
  method ENUM('qr','zoom','manual','device') NOT NULL DEFAULT 'manual',
  status ENUM('present','absent','late','excused') NULL,
  notes VARCHAR(255) NULL,
  UNIQUE KEY uk_ta_unique (class_session_id, user_id),
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ta_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teacher_timesheets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  sessions_count INT UNSIGNED DEFAULT 0,
  hours_taught DECIMAL(8,2) DEFAULT 0.00,
  late_count INT UNSIGNED DEFAULT 0,
  absent_count INT UNSIGNED DEFAULT 0,
  approved_by BIGINT UNSIGNED NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tt_period (user_id, period_start, period_end),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS substitution_requests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_session_id BIGINT UNSIGNED NOT NULL,
  requester_user_id BIGINT UNSIGNED NOT NULL,
  substitute_user_id BIGINT UNSIGNED NULL,
  reason TEXT NULL,
  status ENUM('pending','approved','rejected','canceled') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  decided_by BIGINT UNSIGNED NULL,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (requester_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (substitute_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (decided_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_sr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

