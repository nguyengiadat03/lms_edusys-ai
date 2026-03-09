-- Grading engine policies by CEFR level and gamification bonus policies

CREATE TABLE IF NOT EXISTS level_grading_policies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  level VARCHAR(32) NOT NULL,
  passing_grade DECIMAL(6,2) NOT NULL,
  notes TEXT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_lgp (tenant_id, level),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grading_components (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  policy_id BIGINT UNSIGNED NOT NULL,
  component ENUM('classroom','group','individual','progress','final') NOT NULL,
  weight DECIMAL(6,3) NOT NULL,
  UNIQUE KEY uk_gc_component (policy_id, component),
  FOREIGN KEY (policy_id) REFERENCES level_grading_policies(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS level_skill_minima (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  policy_id BIGINT UNSIGNED NOT NULL,
  skill ENUM('listening','speaking','reading','writing') NOT NULL,
  min_score DECIMAL(6,2) NOT NULL,
  UNIQUE KEY uk_lsm (policy_id, skill),
  FOREIGN KEY (policy_id) REFERENCES level_grading_policies(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_gamification_policies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  enable_bonus TINYINT(1) DEFAULT 1,
  bonus_cap_percent DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  rules JSON NULL COMMENT 'mapping of milestones → which component gets bonus',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cgp (class_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grade adjustments applied from gamification or manual overrides
CREATE TABLE IF NOT EXISTS grade_adjustments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  component ENUM('classroom','group','individual','progress','final') NOT NULL,
  source ENUM('quest_bonus','attendance_bonus','manual','other') NOT NULL DEFAULT 'other',
  percent_bonus DECIMAL(6,2) NULL,
  points_bonus DECIMAL(8,2) NULL,
  reason VARCHAR(255) NULL,
  applied_by BIGINT UNSIGNED NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (applied_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ga_student (class_id, student_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

