-- Import/Export jobs and results

CREATE TABLE IF NOT EXISTS import_jobs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  job_type ENUM('students','enrollments','grades','sessions','users','assignments','documents','other') NOT NULL,
  source ENUM('csv','xlsx','api','other') NOT NULL DEFAULT 'csv',
  status ENUM('queued','running','completed','failed','canceled') NOT NULL DEFAULT 'queued',
  file_path TEXT NULL,
  started_at DATETIME NULL,
  finished_at DATETIME NULL,
  created_by BIGINT UNSIGNED NULL,
  log TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_ij_tenant (tenant_id),
  INDEX idx_ij_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS import_results (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  row_no INT UNSIGNED NULL,
  status ENUM('success','warning','error') NOT NULL,
  message TEXT NULL,
  entity_type VARCHAR(64) NULL,
  entity_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES import_jobs(id) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_ir_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


