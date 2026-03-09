-- Points & Economy: types, rules, ledgers, balances, limits, anomalies

CREATE TABLE IF NOT EXISTS point_types (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_pt_tenant_code (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generic rule with trigger code and JSON conditions for flexibility
CREATE TABLE IF NOT EXISTS point_rules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  point_type_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  trigger_code VARCHAR(64) NOT NULL COMMENT 'e.g., attendance_on_time, assignment_on_time, streak_7',
  conditions JSON NULL COMMENT 'JSON conditions (class/level/thresholds)',
  points_delta INT NOT NULL,
  per_event_limit INT UNSIGNED NULL,
  daily_user_limit INT UNSIGNED NULL,
  weekly_user_limit INT UNSIGNED NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_pr_tenant_code (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (point_type_id) REFERENCES point_types(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_pr_trigger (trigger_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Balance snapshot for quick lookup (optionally scoped by class)
CREATE TABLE IF NOT EXISTS point_balances (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  point_type_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  balance BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_pb_user_type_class (user_id, point_type_id, class_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (point_type_id) REFERENCES point_types(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_pb_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ledger of earnings/deductions with full provenance
CREATE TABLE IF NOT EXISTS point_ledgers (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  point_type_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  rule_id BIGINT UNSIGNED NULL,
  delta INT NOT NULL,
  source_type ENUM('attendance','assignment','game','exam','quest','manual','other') NOT NULL DEFAULT 'other',
  source_id BIGINT UNSIGNED NULL,
  reason VARCHAR(255) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (point_type_id) REFERENCES point_types(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (rule_id) REFERENCES point_rules(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_pl_user_time (user_id, created_at),
  INDEX idx_pl_source (source_type, source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: global/type/rule-based limits (beyond per-rule fields)
CREATE TABLE IF NOT EXISTS point_limits (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  point_type_id BIGINT UNSIGNED NULL,
  rule_id BIGINT UNSIGNED NULL,
  period ENUM('day','week','month','ever') NOT NULL,
  max_points INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (point_type_id) REFERENCES point_types(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (rule_id) REFERENCES point_rules(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_plim_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anti-cheat monitoring
CREATE TABLE IF NOT EXISTS point_anomalies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  point_type_id BIGINT UNSIGNED NULL,
  detected_on DATE NOT NULL,
  reason VARCHAR(255) NULL,
  details JSON NULL,
  status ENUM('open','reviewed','dismissed') NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (point_type_id) REFERENCES point_types(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_pan_user_date (user_id, detected_on),
  INDEX idx_pan_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS point_review_queue (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  anomaly_id BIGINT UNSIGNED NOT NULL,
  reviewer_user_id BIGINT UNSIGNED NULL,
  decision ENUM('approve','reject','escalate') NULL,
  notes TEXT NULL,
  decided_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (anomaly_id) REFERENCES point_anomalies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_prq_anomaly (anomaly_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
