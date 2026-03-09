-- Document Library: ingestion (batch import) and processing/AI pipelines

CREATE TABLE IF NOT EXISTS ingestion_sources (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  provider ENUM('upload','camera','url','gdrive','onedrive','dropbox','other') NOT NULL DEFAULT 'upload',
  credentials JSON NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ing_src (tenant_id, code),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  source_id BIGINT UNSIGNED NULL,
  status ENUM('queued','running','completed','failed','canceled') NOT NULL DEFAULT 'queued',
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  log TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES ingestion_sources(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ing_jobs_tenant (tenant_id),
  INDEX idx_ing_jobs_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ingestion_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  source_path TEXT NULL,
  url TEXT NULL,
  status ENUM('queued','processing','created','failed','skipped') NOT NULL DEFAULT 'queued',
  document_id BIGINT UNSIGNED NULL,
  message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES ingestion_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ing_items_job (job_id),
  INDEX idx_ing_items_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_processing_jobs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT UNSIGNED NOT NULL,
  task ENUM('ocr','summarize','segment','transcode','thumbnail','analyze_level','analyze_topic') NOT NULL,
  status ENUM('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  error_message TEXT NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_dpj_doc (document_id),
  INDEX idx_dpj_task (task),
  INDEX idx_dpj_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_ai_tasks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT UNSIGNED NOT NULL,
  task_type ENUM('summarize','tag_suggestion','segment','level_suggestion','topic_suggestion','other') NOT NULL,
  provider VARCHAR(64) NULL,
  status ENUM('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  input_json JSON NULL,
  output_json JSON NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_dat_doc (document_id),
  INDEX idx_dat_type (task_type),
  INDEX idx_dat_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_ai_tag_suggestions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  document_id BIGINT UNSIGNED NOT NULL,
  tag_label VARCHAR(128) NOT NULL,
  confidence DECIMAL(5,2) NULL,
  accepted TINYINT(1) DEFAULT 0,
  accepted_by BIGINT UNSIGNED NULL,
  accepted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (accepted_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_dats_doc (document_id),
  INDEX idx_dats_label (tag_label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

