-- Exam Events: scheduling, registrations, rooms, proctors

CREATE TABLE IF NOT EXISTS exam_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  exam_version_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  mode ENUM('online','offline','hybrid') NOT NULL DEFAULT 'online',
  group_mode ENUM('class','group','individual') NOT NULL DEFAULT 'class',
  class_id BIGINT UNSIGNED NULL,
  scheduled_start DATETIME NOT NULL,
  scheduled_end DATETIME NOT NULL,
  registration_deadline DATETIME NULL,
  capacity INT UNSIGNED NULL,
  campus_id BIGINT UNSIGNED NULL,
  room_info VARCHAR(255) NULL,
  meeting_provider ENUM('zoom','meet','teams','other') NULL,
  meeting_url TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (exam_version_id) REFERENCES exam_versions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_event_tenant (tenant_id),
  INDEX idx_event_time (scheduled_start),
  INDEX idx_event_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_registrations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exam_event_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  status ENUM('registered','checked_in','in_progress','submitted','graded','absent','no_show','canceled') NOT NULL DEFAULT 'registered',
  seat_no VARCHAR(16) NULL,
  check_in_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_exam_reg (exam_event_id, student_user_id),
  FOREIGN KEY (exam_event_id) REFERENCES exam_events(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_reg_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_rooms (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  campus_id BIGINT UNSIGNED NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NULL,
  capacity INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON UPDATE CASCADE ON DELETE SET NULL,
  UNIQUE KEY uk_exam_room (campus_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_room_allocations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exam_event_id BIGINT UNSIGNED NOT NULL,
  exam_room_id BIGINT UNSIGNED NOT NULL,
  seat_no VARCHAR(16) NULL,
  student_user_id BIGINT UNSIGNED NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_room_seat (exam_event_id, exam_room_id, seat_no),
  FOREIGN KEY (exam_event_id) REFERENCES exam_events(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (exam_room_id) REFERENCES exam_rooms(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (student_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_era_event (exam_event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proctor_assignments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  exam_event_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('proctor','invigilator','assistant') NOT NULL DEFAULT 'proctor',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  UNIQUE KEY uk_proctor_assign (exam_event_id, user_id, role),
  FOREIGN KEY (exam_event_id) REFERENCES exam_events(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

