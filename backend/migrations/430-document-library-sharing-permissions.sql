-- Document Library: sharing and collection permissions

CREATE TABLE IF NOT EXISTS document_shares (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT UNSIGNED NOT NULL,
  subject_type ENUM('user','role','org_unit') NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  permission ENUM('view','download','edit','delete','share') NOT NULL DEFAULT 'view',
  expires_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ds_doc (document_id),
  INDEX idx_ds_subject (subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_collection_permissions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  collection_id BIGINT UNSIGNED NOT NULL,
  subject_type ENUM('user','role','org_unit') NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  permission ENUM('view','edit','manage','share') NOT NULL DEFAULT 'view',
  expires_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collection_id) REFERENCES document_collections(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_dcp_collection (collection_id),
  INDEX idx_dcp_subject (subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_collection_favorites (
  collection_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, user_id),
  FOREIGN KEY (collection_id) REFERENCES document_collections(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

