-- Reminder policies and scheduled reminder jobs

CREATE TABLE IF NOT EXISTS reminder_policies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  audience ENUM('student','teacher','staff','class') NOT NULL,
  context ENUM('class_session','exam_event','staff_shift') NOT NULL,
  offsets_json JSON NOT NULL COMMENT 'e.g. [ -1440, -60, -10 ] minutes before',
  channels JSON NULL COMMENT 'e.g. ["in_app","email","sms"]',
  quiet_hours JSON NULL COMMENT '{ start: "22:00", end: "07:00" }',
  is_active TINYINT(1) DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_rp_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reminder_jobs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  policy_id BIGINT UNSIGNED NULL,
  context_type ENUM('class_session','exam_event','staff_shift') NOT NULL,
  context_id BIGINT UNSIGNED NOT NULL,
  target_datetime DATETIME NOT NULL,
  status ENUM('scheduled','sent','canceled','failed') NOT NULL DEFAULT 'scheduled',
  channel ENUM('email','sms','push','in_app') NOT NULL DEFAULT 'in_app',
  template_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  error_message TEXT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (policy_id) REFERENCES reminder_policies(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_rj_target (target_datetime),
  INDEX idx_rj_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

