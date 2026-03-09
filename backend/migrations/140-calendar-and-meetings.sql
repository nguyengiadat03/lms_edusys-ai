-- External calendars, sync and meeting integrations

CREATE TABLE IF NOT EXISTS external_calendars (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('google','microsoft','zoom','other') NOT NULL,
  account_email VARCHAR(255) NULL,
  external_account_id VARCHAR(128) NULL,
  token_json JSON NULL,
  expires_at DATETIME NULL,
  scope VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ec_user (user_id),
  INDEX idx_ec_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calendar_events_sync (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_session_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('google','microsoft','other') NOT NULL,
  external_event_id VARCHAR(128) NULL,
  sync_status ENUM('pending','synced','error','deleted') NOT NULL DEFAULT 'pending',
  last_synced_at DATETIME NULL,
  error_message TEXT NULL,
  UNIQUE KEY uk_event_sync (class_session_id, provider),
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meeting_integrations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  class_session_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('zoom','meet','teams','other') NOT NULL,
  meeting_id VARCHAR(128) NULL,
  join_url TEXT NULL,
  start_url TEXT NULL,
  host_id VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_meeting_session (class_session_id, provider),
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meeting_attendance_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  meeting_integration_id BIGINT UNSIGNED NOT NULL,
  participant_name VARCHAR(255) NULL,
  participant_email VARCHAR(255) NULL,
  user_id BIGINT UNSIGNED NULL,
  join_time DATETIME NULL,
  leave_time DATETIME NULL,
  duration_seconds INT UNSIGNED NULL,
  FOREIGN KEY (meeting_integration_id) REFERENCES meeting_integrations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_mal_meeting (meeting_integration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

