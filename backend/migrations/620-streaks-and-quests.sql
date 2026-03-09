-- Streaks & Quests

CREATE TABLE IF NOT EXISTS streaks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  streak_type ENUM('daily','weekly','class') NOT NULL DEFAULT 'daily',
  class_id BIGINT UNSIGNED NULL,
  current_streak_days INT UNSIGNED NOT NULL DEFAULT 0,
  best_streak_days INT UNSIGNED NOT NULL DEFAULT 0,
  last_achieved_date DATE NULL,
  mulligans_used INT UNSIGNED DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_streak_user_type (user_id, streak_type, class_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS streak_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  streak_type ENUM('daily','weekly','class') NOT NULL DEFAULT 'daily',
  class_id BIGINT UNSIGNED NULL,
  event_date DATE NOT NULL,
  action ENUM('increment','break','mulligan') NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_se_user_date (user_id, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  quest_type ENUM('daily','weekly','seasonal') NOT NULL,
  description TEXT NULL,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  reward_points INT NULL,
  reward_point_type_id BIGINT UNSIGNED NULL,
  reward_badge_id BIGINT UNSIGNED NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_quest_tenant_code (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (reward_point_type_id) REFERENCES point_types(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (reward_badge_id) REFERENCES badges(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quest_tasks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quest_id BIGINT UNSIGNED NOT NULL,
  task_code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  conditions JSON NULL,
  points INT NULL,
  order_index INT UNSIGNED DEFAULT 0,
  UNIQUE KEY uk_qt_code (quest_id, task_code),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assignment by class or user through generic subject reference
CREATE TABLE IF NOT EXISTS quest_assignments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quest_id BIGINT UNSIGNED NOT NULL,
  subject_type ENUM('user','class') NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_qa_unique (quest_id, subject_type, subject_id),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_qa_subject (subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quest_progress (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quest_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  progress_json JSON NULL,
  completed TINYINT(1) DEFAULT 0,
  completed_at DATETIME NULL,
  UNIQUE KEY uk_qp_user (quest_id, user_id),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quest_task_progress (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quest_id BIGINT UNSIGNED NOT NULL,
  task_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','in_progress','done') NOT NULL DEFAULT 'pending',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_qtp_unique (quest_id, task_id, user_id),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES quest_tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quest_rewards (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quest_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  reward_type ENUM('points','badge','item','entitlement') NOT NULL,
  payload JSON NULL,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_qr_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
