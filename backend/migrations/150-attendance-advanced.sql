-- Advanced attendance: check-ins, reschedule history, conflict logs

CREATE TABLE IF NOT EXISTS attendance_checkins (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_session_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  method ENUM('qr','zoom','manual','device') NOT NULL DEFAULT 'manual',
  device_info JSON NULL,
  geo_lat DECIMAL(9,6) NULL,
  geo_lng DECIMAL(9,6) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ac_session (class_session_id),
  INDEX idx_ac_student (student_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reschedule_history (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_session_id BIGINT UNSIGNED NOT NULL,
  old_starts_at DATETIME NOT NULL,
  old_ends_at DATETIME NOT NULL,
  new_starts_at DATETIME NOT NULL,
  new_ends_at DATETIME NOT NULL,
  reason TEXT NULL,
  changed_by BIGINT UNSIGNED NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_rh_session (class_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS conflict_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NULL,
  class_session_id BIGINT UNSIGNED NULL,
  conflict_type ENUM('teacher','room','student','other') NOT NULL,
  details JSON NULL,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_cl_class (class_id),
  INDEX idx_cl_session (class_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

