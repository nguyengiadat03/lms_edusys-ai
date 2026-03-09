-- Assessments, assignment submissions, rubrics, and gradebook

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  attempt_no INT UNSIGNED DEFAULT 1,
  status ENUM('draft','submitted','graded','returned') DEFAULT 'submitted',
  submitted_at TIMESTAMP NULL,
  graded_at TIMESTAMP NULL,
  graded_by BIGINT UNSIGNED NULL,
  score DECIMAL(6,2) NULL,
  feedback TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_asgsub_assignment (assignment_id),
  INDEX idx_asgsub_student (student_user_id),
  UNIQUE KEY uk_submission_unique (assignment_id, student_user_id, attempt_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submission_files (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  submission_id BIGINT UNSIGNED NOT NULL,
  file_path TEXT NULL,
  url TEXT NULL,
  mime_type VARCHAR(128) NULL,
  file_size BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_sf_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submission_feedback (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  submission_id BIGINT UNSIGNED NOT NULL,
  teacher_user_id BIGINT UNSIGNED NOT NULL,
  comment TEXT NULL,
  rubric_scores JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (teacher_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_sfb_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL,
  assessment_type ENUM('pre','mid','final','project','quiz','other') DEFAULT 'other',
  total_score DECIMAL(8,2) DEFAULT 100.0,
  due_at TIMESTAMP NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_assessments_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  assessment_id BIGINT UNSIGNED NOT NULL,
  item_type ENUM('section','question','task') DEFAULT 'question',
  title VARCHAR(255) NULL,
  max_score DECIMAL(8,2) DEFAULT 0,
  order_index INT UNSIGNED DEFAULT 0,
  payload JSON NULL,
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ai_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_results (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  assessment_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(8,2) NULL,
  details JSON NULL,
  graded_at TIMESTAMP NULL,
  graded_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_assessment_student (assessment_id, student_user_id),
  FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Normalized rubrics for use with submissions or assessment results
CREATE TABLE IF NOT EXISTS rubrics (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rubric_criteria (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rubric_id BIGINT UNSIGNED NOT NULL,
  criterion VARCHAR(255) NOT NULL,
  description TEXT NULL,
  weight DECIMAL(6,3) DEFAULT 1.0,
  order_index INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_rc_rubric (rubric_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rubric_scores (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  rubric_criterion_id BIGINT UNSIGNED NOT NULL,
  submission_id BIGINT UNSIGNED NULL,
  assessment_result_id BIGINT UNSIGNED NULL,
  score DECIMAL(6,2) NULL,
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rubric_criterion_id) REFERENCES rubric_criteria(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (submission_id) REFERENCES assignment_submissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (assessment_result_id) REFERENCES assessment_results(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_rs_sub (submission_id),
  INDEX idx_rs_res (assessment_result_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gradebook
CREATE TABLE IF NOT EXISTS grade_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  source_type ENUM('assignment','assessment','custom') NOT NULL,
  source_id BIGINT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL,
  max_score DECIMAL(8,2) NOT NULL DEFAULT 100.0,
  weight DECIMAL(6,3) NOT NULL DEFAULT 1.0,
  order_index INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_gi_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gradebook_entries (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  grade_item_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(8,2) NULL,
  graded_at TIMESTAMP NULL,
  graded_by BIGINT UNSIGNED NULL,
  UNIQUE KEY uk_grade_entry (grade_item_id, student_user_id),
  FOREIGN KEY (grade_item_id) REFERENCES grade_items(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
