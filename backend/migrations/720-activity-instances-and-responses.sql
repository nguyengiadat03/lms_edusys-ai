-- Instances (binding templates to sessions) and lightweight responses

CREATE TABLE IF NOT EXISTS session_activity_instances (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_activity_id BIGINT UNSIGNED NOT NULL,
  activity_template_id BIGINT UNSIGNED NOT NULL,
  configuration JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sai (session_activity_id, activity_template_id),
  FOREIGN KEY (session_activity_id) REFERENCES session_activities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (activity_template_id) REFERENCES activity_templates(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS session_activity_groups (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_activity_id BIGINT UNSIGNED NOT NULL,
  student_group_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_sag (session_activity_id, student_group_id),
  FOREIGN KEY (session_activity_id) REFERENCES session_activities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_group_id) REFERENCES student_groups(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_responses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_activity_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  response_json JSON NULL,
  score DECIMAL(8,2) NULL,
  feedback TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ar_unique (session_activity_id, user_id),
  FOREIGN KEY (session_activity_id) REFERENCES session_activities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ar_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_response_files (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  response_id BIGINT UNSIGNED NOT NULL,
  document_id BIGINT UNSIGNED NULL,
  url TEXT NULL,
  mime_type VARCHAR(128) NULL,
  file_size BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (response_id) REFERENCES activity_responses(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_arf_response (response_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

