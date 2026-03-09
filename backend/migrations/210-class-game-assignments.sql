-- Class-level game assignments and group mapping

CREATE TABLE IF NOT EXISTS class_game_assignments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  assigned_by BIGINT UNSIGNED NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  group_mode ENUM('individual','group') NOT NULL DEFAULT 'individual',
  available_at DATETIME NULL,
  due_at DATETIME NULL,
  max_attempts INT UNSIGNED NULL,
  visibility ENUM('class','private','hidden') NOT NULL DEFAULT 'class',
  instructions TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_cga_class (class_id),
  INDEX idx_cga_game (game_id),
  INDEX idx_cga_due (due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_game_assignment_groups (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_game_assignment_id BIGINT UNSIGNED NOT NULL,
  student_group_id BIGINT UNSIGNED NOT NULL,
  UNIQUE KEY uk_cgag_unique (class_game_assignment_id, student_group_id),
  FOREIGN KEY (class_game_assignment_id) REFERENCES class_game_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_group_id) REFERENCES student_groups(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_game_assignment_overrides (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_game_assignment_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  extended_due_at DATETIME NULL,
  max_attempts_override INT UNSIGNED NULL,
  notes VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cgao_unique (class_game_assignment_id, student_user_id),
  FOREIGN KEY (class_game_assignment_id) REFERENCES class_game_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
