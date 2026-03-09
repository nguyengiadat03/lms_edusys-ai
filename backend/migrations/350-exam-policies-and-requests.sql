-- Exam Policies and Requests (retake/reschedule)

CREATE TABLE IF NOT EXISTS exam_policies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  scope_type ENUM('blueprint','event') NOT NULL,
  blueprint_id BIGINT UNSIGNED NULL,
  exam_event_id BIGINT UNSIGNED NULL,
  pass_mark DECIMAL(6,2) NULL,
  max_attempts INT UNSIGNED NULL,
  time_limit_minutes INT UNSIGNED NULL,
  allow_back TINYINT(1) DEFAULT 1,
  open_book TINYINT(1) DEFAULT 0,
  proctoring_required TINYINT(1) DEFAULT 0,
  retake_wait_days INT UNSIGNED NULL,
  ai_scoring_enabled TINYINT(1) DEFAULT 0,
  settings_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (blueprint_id) REFERENCES exam_blueprints(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (exam_event_id) REFERENCES exam_events(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ep_scope (scope_type),
  INDEX idx_ep_blueprint (blueprint_id),
  INDEX idx_ep_event (exam_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS retake_requests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exam_event_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  reason TEXT NULL,
  status ENUM('pending','approved','rejected','canceled') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  decided_by BIGINT UNSIGNED NULL,
  FOREIGN KEY (exam_event_id) REFERENCES exam_events(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (decided_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_rr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reschedule_requests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exam_event_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  reason TEXT NULL,
  old_time DATETIME NULL,
  new_time DATETIME NULL,
  status ENUM('pending','approved','rejected','canceled') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  decided_by BIGINT UNSIGNED NULL,
  FOREIGN KEY (exam_event_id) REFERENCES exam_events(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (decided_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_sr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

