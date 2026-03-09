-- Staff shifts, assignments, attendance, and leave/OT

CREATE TABLE IF NOT EXISTS staff_shifts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  campus_id BIGINT UNSIGNED NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NULL,
  starts_at TIME NOT NULL,
  ends_at TIME NOT NULL,
  recurrence ENUM('none','daily','weekly','custom') NOT NULL DEFAULT 'weekly',
  weekday_mask TINYINT UNSIGNED NULL COMMENT 'bitmask 0-6 for weekly',
  timezone VARCHAR(64) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_staff_shift (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_shift_assignments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  staff_shift_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  valid_from DATE NULL,
  valid_to DATE NULL,
  UNIQUE KEY uk_shift_user (staff_shift_id, user_id, valid_from, valid_to),
  FOREIGN KEY (staff_shift_id) REFERENCES staff_shifts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_attendance (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  shift_assignment_id BIGINT UNSIGNED NULL,
  check_in_at DATETIME NULL,
  check_out_at DATETIME NULL,
  method ENUM('qr','kiosk','gps','manual') NOT NULL DEFAULT 'kiosk',
  geo_lat DECIMAL(9,6) NULL,
  geo_lng DECIMAL(9,6) NULL,
  status ENUM('present','late','absent','excused') NULL,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (shift_assignment_id) REFERENCES staff_shift_assignments(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_sta_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS time_off_requests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  leave_type ENUM('annual','sick','unpaid','other') NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NULL,
  status ENUM('pending','approved','rejected','canceled') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  decided_by BIGINT UNSIGNED NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (decided_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_tor_user (user_id),
  INDEX idx_tor_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS overtime_requests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(6,2) NOT NULL,
  reason TEXT NULL,
  status ENUM('pending','approved','rejected','canceled') NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at DATETIME NULL,
  decided_by BIGINT UNSIGNED NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (decided_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_otr_user (user_id),
  INDEX idx_otr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: geofence zones and user devices
CREATE TABLE IF NOT EXISTS geo_zones (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  center_lat DECIMAL(9,6) NOT NULL,
  center_lng DECIMAL(9,6) NOT NULL,
  radius_meters INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_devices (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  device_id VARCHAR(128) NOT NULL,
  device_type VARCHAR(64) NULL,
  last_seen_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sd_user_device (user_id, device_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
