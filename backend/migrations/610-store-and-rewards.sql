-- Store/Rewards: items, redemptions, entitlements, usage logs

CREATE TABLE IF NOT EXISTS store_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  point_type_id BIGINT UNSIGNED NOT NULL,
  cost_points INT NOT NULL,
  inventory_count INT UNSIGNED NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_store_item (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (point_type_id) REFERENCES point_types(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_redemptions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  item_id BIGINT UNSIGNED NOT NULL,
  points_spent INT NOT NULL,
  status ENUM('pending','approved','rejected','fulfilled','canceled') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  decided_by BIGINT UNSIGNED NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES store_items(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (decided_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_sr_user (user_id),
  INDEX idx_sr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reward_entitlements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  redemption_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  entitlement_type ENUM('deadline_extension','retake_ticket','voucher','custom') NOT NULL,
  payload JSON NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (redemption_id) REFERENCES store_redemptions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_re_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reward_usage_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entitlement_id BIGINT UNSIGNED NOT NULL,
  used_by BIGINT UNSIGNED NULL,
  context_type ENUM('class','assignment','exam','other') NOT NULL,
  context_id BIGINT UNSIGNED NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes VARCHAR(255) NULL,
  FOREIGN KEY (entitlement_id) REFERENCES reward_entitlements(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (used_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_rul_ent (entitlement_id),
  INDEX idx_rul_context (context_type, context_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

