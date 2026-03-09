-- Class assignments linking and class policies

CREATE TABLE IF NOT EXISTS class_assignments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  assignment_id BIGINT UNSIGNED NOT NULL,
  assigned_by BIGINT UNSIGNED NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  available_at DATETIME NULL,
  due_at DATETIME NULL,
  max_attempts INT UNSIGNED NULL,
  late_policy ENUM('allow','deduct','reject') NOT NULL DEFAULT 'allow',
  late_deduction_percent DECIMAL(5,2) NULL,
  visibility ENUM('class','private','hidden') NOT NULL DEFAULT 'class',
  instructions TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ca_class (class_id),
  INDEX idx_ca_assignment (assignment_id),
  INDEX idx_ca_due (due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_assignment_overrides (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_assignment_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  extended_due_at DATETIME NULL,
  late_policy_override ENUM('allow','deduct','reject') NULL,
  notes VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_override_unique (class_assignment_id, student_user_id),
  FOREIGN KEY (class_assignment_id) REFERENCES class_assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS class_policies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  attendance_required_percent DECIMAL(5,2) NULL,
  late_submission_policy ENUM('allow','deduct','reject') NOT NULL DEFAULT 'allow',
  late_deduction_per_day DECIMAL(5,2) NULL,
  max_late_days INT UNSIGNED NULL,
  grading_policy JSON NULL,
  exam_rules JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_policy_class (class_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
