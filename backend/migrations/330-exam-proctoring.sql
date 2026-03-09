-- Proctoring sessions, events, snapshots

CREATE TABLE IF NOT EXISTS proctoring_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exam_attempt_id BIGINT UNSIGNED NOT NULL,
  proctor_user_id BIGINT UNSIGNED NULL,
  provider ENUM('internal','zoom','third_party') NOT NULL DEFAULT 'internal',
  status ENUM('active','ended','canceled') NOT NULL DEFAULT 'active',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_attempt_id) REFERENCES exam_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (proctor_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ps_attempt (exam_attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proctoring_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  proctoring_session_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('tab_switch','no_face','multiple_faces','noise','suspicious_object','network','window_blur','other') NOT NULL DEFAULT 'other',
  severity ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  details JSON NULL,
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proctoring_session_id) REFERENCES proctoring_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_pe_session (proctoring_session_id),
  INDEX idx_pe_occurred (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proctoring_snapshots (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  proctoring_session_id BIGINT UNSIGNED NOT NULL,
  image_document_id BIGINT UNSIGNED NULL,
  thumbnail_document_id BIGINT UNSIGNED NULL,
  captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proctoring_session_id) REFERENCES proctoring_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (image_document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (thumbnail_document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_psn_session (proctoring_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

