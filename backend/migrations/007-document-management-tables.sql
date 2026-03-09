-- ===========================================
-- DOCUMENT MANAGEMENT TABLES MIGRATION
-- Tạo các bảng cần thiết cho Document Management
-- Database: edusys_ai_2025_v1
-- ===========================================

USE `edusys_ai_2025_v1`;

-- ===========================================
-- DOCUMENT COLLECTIONS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_collections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tenant_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `is_public` BOOLEAN DEFAULT FALSE,
  `created_by` BIGINT UNSIGNED NULL,
  `updated_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_doc_collections_tenant` (`tenant_id`),
  KEY `idx_doc_collections_public` (`is_public`),
  KEY `idx_doc_collections_created_by` (`created_by`),
  CONSTRAINT `fk_doc_collections_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doc_collections_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_doc_collections_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT COLLECTION PERMISSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_collection_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `subject_type` ENUM('user', 'role', 'group') NOT NULL,
  `subject_id` BIGINT UNSIGNED NOT NULL,
  `permission` ENUM('view', 'edit', 'admin') DEFAULT 'view',
  `expires_at` TIMESTAMP NULL,
  `created_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dcp_collection` (`collection_id`),
  KEY `idx_dcp_subject` (`subject_type`, `subject_id`),
  CONSTRAINT `fk_dcp_collection` FOREIGN KEY (`collection_id`) REFERENCES `document_collections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dcp_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT COLLECTION FAVORITES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_collection_favorites` (
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`collection_id`, `user_id`),
  KEY `idx_dcf_user` (`user_id`),
  CONSTRAINT `fk_dcf_collection` FOREIGN KEY (`collection_id`) REFERENCES `document_collections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dcf_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT DERIVATIVES TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_derivatives` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` BIGINT UNSIGNED NOT NULL,
  `kind` ENUM('thumbnail', 'preview', 'conversion', 'compressed') NOT NULL,
  `format` VARCHAR(64) NULL,
  `width` INT UNSIGNED NULL,
  `height` INT UNSIGNED NULL,
  `duration_seconds` INT UNSIGNED NULL,
  `file_path` TEXT NULL,
  `url` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dd_doc` (`document_id`),
  KEY `idx_dd_kind` (`kind`),
  CONSTRAINT `fk_dd_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT EXTERNAL REFS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_external_refs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` BIGINT UNSIGNED NOT NULL,
  `provider` ENUM('google_drive', 'dropbox', 'onedrive', 'aws_s3') NOT NULL,
  `external_id` VARCHAR(255) NULL,
  `web_view_url` TEXT NULL,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doc_ext` (`document_id`, `provider`),
  KEY `idx_der_provider` (`provider`),
  CONSTRAINT `fk_der_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT FAVORITES TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_favorites` (
  `document_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`, `user_id`),
  KEY `idx_df_user` (`user_id`),
  CONSTRAINT `fk_df_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_df_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT PAGES TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_pages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` BIGINT UNSIGNED NOT NULL,
  `page_no` INT UNSIGNED NOT NULL,
  `text` LONGTEXT NULL,
  `bbox_json` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doc_page` (`document_id`, `page_no`),
  CONSTRAINT `fk_dp_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT PREVIEWS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_previews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` BIGINT UNSIGNED NOT NULL,
  `preview_url` TEXT NOT NULL,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dp_doc` (`document_id`),
  CONSTRAINT `fk_dp_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT PROCESSING JOBS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_processing_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` BIGINT UNSIGNED NOT NULL,
  `task` ENUM('ocr', 'thumbnail', 'conversion', 'ai_analysis') NOT NULL,
  `status` ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
  `error_message` TEXT NULL,
  `started_at` TIMESTAMP NULL,
  `finished_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dpj_doc` (`document_id`),
  KEY `idx_dpj_status` (`status`),
  KEY `idx_dpj_task` (`task`),
  CONSTRAINT `fk_dpj_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT SHARES TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_shares` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` BIGINT UNSIGNED NOT NULL,
  `subject_type` ENUM('user', 'role', 'group') NOT NULL,
  `subject_id` BIGINT UNSIGNED NOT NULL,
  `permission` ENUM('view', 'edit', 'admin') DEFAULT 'view',
  `expires_at` TIMESTAMP NULL,
  `created_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ds_doc` (`document_id`),
  KEY `idx_ds_subject` (`subject_type`, `subject_id`),
  CONSTRAINT `fk_ds_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ds_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT TAGS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_tags` (
  `document_id` BIGINT UNSIGNED NOT NULL,
  `tag_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`document_id`, `tag_id`),
  KEY `idx_dt_tag` (`tag_id`),
  CONSTRAINT `fk_dt_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dt_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT AI TAG SUGGESTIONS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_ai_tag_suggestions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` BIGINT UNSIGNED NOT NULL,
  `tag_label` VARCHAR(128) NOT NULL,
  `confidence` DECIMAL(5,2) NULL,
  `accepted` BOOLEAN DEFAULT FALSE,
  `accepted_by` BIGINT UNSIGNED NULL,
  `accepted_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dats_doc` (`document_id`),
  KEY `idx_dats_label` (`tag_label`),
  CONSTRAINT `fk_dats_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dats_accepted_by` FOREIGN KEY (`accepted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- DOCUMENT AI TASKS TABLE (if not exists)
-- ===========================================
CREATE TABLE IF NOT EXISTS `document_ai_tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `document_id` BIGINT UNSIGNED NOT NULL,
  `task_type` ENUM('ocr', 'ai_tagging', 'thumbnail_generation', 'conversion', 'analysis') NOT NULL,
  `provider` VARCHAR(64) NULL,
  `status` ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
  `input_json` JSON NULL,
  `output_json` JSON NULL,
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `finished_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dat_doc` (`document_id`),
  KEY `idx_dat_status` (`status`),
  KEY `idx_dat_type` (`task_type`),
  CONSTRAINT `fk_dat_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- UPDATE DOCUMENTS TABLE (add missing columns)
-- ===========================================
ALTER TABLE `documents` 
ADD COLUMN IF NOT EXISTS `ocr_text` LONGTEXT NULL AFTER `file_size`,
ADD COLUMN IF NOT EXISTS `ai_tags` JSON NULL AFTER `ocr_text`,
ADD COLUMN IF NOT EXISTS `manual_tags` JSON NULL AFTER `ai_tags`,
ADD COLUMN IF NOT EXISTS `health_status` ENUM('unknown', 'healthy', 'warning', 'error') DEFAULT 'unknown' AFTER `manual_tags`,
ADD COLUMN IF NOT EXISTS `last_health_check` TIMESTAMP NULL AFTER `health_status`,
ADD COLUMN IF NOT EXISTS `visibility` ENUM('private', 'tenant', 'public') DEFAULT 'tenant' AFTER `last_health_check`;

-- ===========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===========================================
ALTER TABLE `documents` 
ADD INDEX IF NOT EXISTS `idx_documents_visibility` (`visibility`),
ADD INDEX IF NOT EXISTS `idx_documents_health` (`health_status`),
ADD INDEX IF NOT EXISTS `idx_documents_tenant_visibility` (`tenant_id`, `visibility`),
ADD FULLTEXT INDEX IF NOT EXISTS `idx_documents_search` (`name`, `description`, `ocr_text`);

-- ===========================================
-- INSERT SAMPLE DOCUMENT TYPES
-- ===========================================
INSERT IGNORE INTO `tags` (`tenant_id`, `name`, `display_name`, `type`, `color`) VALUES
(1, 'pdf', 'PDF Document', 'document', '#FF5722'),
(1, 'word', 'Word Document', 'document', '#2196F3'),
(1, 'excel', 'Excel Spreadsheet', 'document', '#4CAF50'),
(1, 'powerpoint', 'PowerPoint Presentation', 'document', '#FF9800'),
(1, 'image', 'Image File', 'document', '#9C27B0'),
(1, 'video', 'Video File', 'document', '#F44336'),
(1, 'audio', 'Audio File', 'document', '#607D8B'),
(1, 'text', 'Text Document', 'document', '#795548'),
(1, 'curriculum', 'Curriculum Material', 'document', '#3F51B5'),
(1, 'assignment', 'Assignment', 'document', '#009688'),
(1, 'lesson-plan', 'Lesson Plan', 'document', '#8BC34A'),
(1, 'assessment', 'Assessment', 'document', '#FFC107'),
(1, 'resource', 'Learning Resource', 'document', '#E91E63'),
(1, 'template', 'Template', 'document', '#00BCD4');

-- ===========================================
-- CREATE SAMPLE DOCUMENT COLLECTION
-- ===========================================
INSERT IGNORE INTO `document_collections` (`tenant_id`, `name`, `description`, `is_public`, `created_by`) VALUES
(1, 'Curriculum Resources', 'Collection of curriculum-related documents and materials', TRUE, 1),
(1, 'Assessment Materials', 'Collection of assessment and evaluation materials', TRUE, 1),
(1, 'Lesson Plans', 'Collection of lesson plans and teaching materials', FALSE, 1),
(1, 'Student Resources', 'Collection of resources for students', TRUE, 1);

-- ===========================================
-- VERIFY MIGRATION
-- ===========================================
SELECT '✅ DOCUMENT MANAGEMENT TABLES MIGRATION COMPLETED!' AS status;

-- Show created tables
SELECT 
  TABLE_NAME as 'Table',
  TABLE_ROWS as 'Rows',
  ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'edusys_ai_2025_v1' 
  AND TABLE_NAME IN (
    'document_collections',
    'document_collection_permissions',
    'document_collection_favorites',
    'document_derivatives',
    'document_external_refs',
    'document_favorites',
    'document_pages',
    'document_previews',
    'document_processing_jobs',
    'document_shares',
    'document_tags',
    'document_ai_tag_suggestions',
    'document_ai_tasks'
  )
ORDER BY TABLE_NAME;