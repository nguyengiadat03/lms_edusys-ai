-- Games: sessions, attempts, leaderboards, badges

CREATE TABLE IF NOT EXISTS game_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  game_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  class_session_id BIGINT UNSIGNED NULL,
  host_user_id BIGINT UNSIGNED NULL,
  status ENUM('scheduled','active','ended','canceled') NOT NULL DEFAULT 'scheduled',
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  configuration JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (host_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_gs_game (game_id),
  INDEX idx_gs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_attempts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  game_session_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  team_name VARCHAR(64) NULL,
  score DECIMAL(10,2) NULL,
  duration_seconds INT UNSIGNED NULL,
  details JSON NULL,
  started_at DATETIME NULL,
  ended_at DATETIME NULL,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ga_session (game_session_id),
  INDEX idx_ga_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_scores (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  game_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  best_score DECIMAL(10,2) NULL,
  attempts_count INT UNSIGNED DEFAULT 0,
  last_attempt_at DATETIME NULL,
  UNIQUE KEY uk_gs_game_class_user (game_id, class_id, user_id),
  FOREIGN KEY (game_id) REFERENCES games(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leaderboards (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  scope_type ENUM('class','tenant','global') NOT NULL DEFAULT 'class',
  scope_id BIGINT UNSIGNED NULL,
  game_id BIGINT UNSIGNED NULL,
  period ENUM('all_time','monthly','weekly','daily') NOT NULL DEFAULT 'all_time',
  title VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_lb_scope (scope_type, scope_id),
  INDEX idx_lb_game (game_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  leaderboard_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(10,2) NOT NULL,
  rank_position INT UNSIGNED NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_lb_entry (leaderboard_id, user_id),
  FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS badges (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  criteria JSON NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_badge_tenant_code (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_badges (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  badge_id BIGINT UNSIGNED NOT NULL,
  awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_badge (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
