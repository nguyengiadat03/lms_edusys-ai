-- Link activity templates to curriculum units

CREATE TABLE IF NOT EXISTS unit_activity_links (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  unit_blueprint_id BIGINT UNSIGNED NOT NULL,
  activity_template_id BIGINT UNSIGNED NOT NULL,
  order_index INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_blueprint_id) REFERENCES unit_blueprints(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (activity_template_id) REFERENCES activity_templates(id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY uk_unit_activity (unit_blueprint_id, activity_template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

