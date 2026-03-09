-- Session plans/activities/materials for classes

CREATE TABLE IF NOT EXISTS session_plans (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_session_id BIGINT UNSIGNED NOT NULL,
  objectives JSON NULL,
  notes TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  UNIQUE KEY uk_session_plan (class_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS session_activities (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_plan_id BIGINT UNSIGNED NOT NULL,
  activity_type ENUM('warm_up','presentation','practice','production','assessment','homework','other') DEFAULT 'other',
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  duration_minutes INT UNSIGNED NULL,
  order_index INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_plan_id) REFERENCES session_plans(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_sa_plan_order (session_plan_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS session_materials (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_plan_id BIGINT UNSIGNED NOT NULL,
  session_activity_id BIGINT UNSIGNED NULL,
  document_id BIGINT UNSIGNED NULL,
  url TEXT NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_plan_id) REFERENCES session_plans(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (session_activity_id) REFERENCES session_activities(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_sm_plan (session_plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

