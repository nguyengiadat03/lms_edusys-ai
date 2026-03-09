-- Activity Bank: templates, steps, roles, assets, tags

CREATE TABLE IF NOT EXISTS activity_templates (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  activity_kind ENUM('discussion','role_play','presentation','listening_drill','quick_quiz','flashcards','writing_log','debate','e_learning','other') NOT NULL DEFAULT 'other',
  phase_hint ENUM('pre','in','post') NULL,
  level VARCHAR(32) NULL,
  skill ENUM('listening','speaking','reading','writing','vocabulary','grammar','general') NULL,
  duration_minutes INT UNSIGNED NULL,
  objectives JSON NULL,
  instructions TEXT NULL,
  configuration JSON NULL,
  owner_user_id BIGINT UNSIGNED NULL,
  visibility ENUM('private','tenant','public') NOT NULL DEFAULT 'tenant',
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_activity_tpl_code (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_act_tpl_skill (skill),
  INDEX idx_act_tpl_kind (activity_kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_template_steps (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT UNSIGNED NOT NULL,
  step_type ENUM('warm_up','instruction','pair_work','group_work','individual','assessment','wrap_up','other') NOT NULL DEFAULT 'other',
  title VARCHAR(255) NULL,
  description TEXT NULL,
  duration_minutes INT UNSIGNED NULL,
  order_index INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES activity_templates(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ats_template_order (template_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_template_roles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT UNSIGNED NOT NULL,
  role_name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  order_index INT UNSIGNED DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES activity_templates(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_atr_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_template_assets (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  template_id BIGINT UNSIGNED NOT NULL,
  document_id BIGINT UNSIGNED NULL,
  url TEXT NULL,
  notes VARCHAR(255) NULL,
  FOREIGN KEY (template_id) REFERENCES activity_templates(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ataa_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_template_tags (
  template_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (template_id, tag_id),
  FOREIGN KEY (template_id) REFERENCES activity_templates(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

