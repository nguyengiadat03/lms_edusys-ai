-- Calendar: Recurrence rules, unified events, participants

CREATE TABLE IF NOT EXISTS recurrence_rules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  scope_type ENUM('class','staff_shift','other') NOT NULL DEFAULT 'class',
  scope_id BIGINT UNSIGNED NOT NULL,
  rrule TEXT NOT NULL COMMENT 'iCalendar RRULE string',
  dtstart DATETIME NOT NULL,
  until DATETIME NULL,
  timezone VARCHAR(64) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_rr_tenant (tenant_id),
  INDEX idx_rr_scope (scope_type, scope_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional materialized occurrences produced from RRULEs
CREATE TABLE IF NOT EXISTS session_recurrences (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  recurrence_rule_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  occurrence_start DATETIME NOT NULL,
  occurrence_end DATETIME NOT NULL,
  linked_session_id BIGINT UNSIGNED NULL COMMENT 'class_sessions.id if instantiated',
  status ENUM('planned','instantiated','skipped') NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (recurrence_rule_id) REFERENCES recurrence_rules(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (linked_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_sr_rule (recurrence_rule_id),
  INDEX idx_sr_class_time (class_id, occurrence_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Unified calendar events for multiple types (class, exam, shift, meeting)
CREATE TABLE IF NOT EXISTS calendar_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('class_session','exam_event','meeting','staff_shift','other') NOT NULL,
  ref_id BIGINT UNSIGNED NULL,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  location VARCHAR(255) NULL,
  visibility ENUM('tenant','campus','class','private') NOT NULL DEFAULT 'tenant',
  campus_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ce_tenant_time (tenant_id, starts_at),
  INDEX idx_ce_type_ref (event_type, ref_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calendar_event_participants (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  calendar_event_id BIGINT UNSIGNED NOT NULL,
  subject_type ENUM('user','class','org_unit','role') NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  role ENUM('attendee','host','teacher','student','staff','proctor') NOT NULL DEFAULT 'attendee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_cep_event (calendar_event_id),
  INDEX idx_cep_subject (subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

