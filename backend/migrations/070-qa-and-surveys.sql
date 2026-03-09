-- QA Observations and Surveys

CREATE TABLE IF NOT EXISTS class_observations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT UNSIGNED NOT NULL,
  class_session_id BIGINT UNSIGNED NULL,
  observer_user_id BIGINT UNSIGNED NOT NULL,
  rubric_id BIGINT UNSIGNED NULL,
  observation_date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (observer_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_obs_class (class_id),
  INDEX idx_obs_date (observation_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS observation_scores (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  observation_id BIGINT UNSIGNED NOT NULL,
  rubric_criterion_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(6,2) NULL,
  comment TEXT NULL,
  FOREIGN KEY (observation_id) REFERENCES class_observations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (rubric_criterion_id) REFERENCES rubric_criteria(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_os_obs (observation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS surveys (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  target_type ENUM('student','guardian','teacher','class','general') DEFAULT 'general',
  description TEXT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_surveys_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS survey_questions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  survey_id BIGINT UNSIGNED NOT NULL,
  question_type ENUM('text','number','single_choice','multiple_choice','scale') NOT NULL,
  question_text TEXT NOT NULL,
  options JSON NULL,
  order_index INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_sq_survey (survey_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS survey_responses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  survey_id BIGINT UNSIGNED NOT NULL,
  respondent_user_id BIGINT UNSIGNED NULL,
  class_id BIGINT UNSIGNED NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (respondent_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_sr_survey (survey_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS survey_answers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  response_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  answer_text TEXT NULL,
  answer_number DECIMAL(10,2) NULL,
  FOREIGN KEY (response_id) REFERENCES survey_responses(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES survey_questions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_sa_response (response_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

