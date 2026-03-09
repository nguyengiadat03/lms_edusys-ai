-- Document Library: pages, derivatives, previews

CREATE TABLE IF NOT EXISTS document_pages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT UNSIGNED NOT NULL,
  page_no INT UNSIGNED NOT NULL,
  text LONGTEXT NULL,
  bbox_json JSON NULL COMMENT 'Optional bounding boxes for words/lines',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_doc_page (document_id, page_no),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_derivatives (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT UNSIGNED NOT NULL,
  kind ENUM('thumbnail','preview_pdf','preview_image','audio_transcode','video_transcode','other') NOT NULL,
  format VARCHAR(64) NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  duration_seconds INT UNSIGNED NULL,
  file_path TEXT NULL,
  url TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_dd_doc (document_id),
  INDEX idx_dd_kind (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_previews (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT UNSIGNED NOT NULL,
  preview_url TEXT NOT NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_dp_doc (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

