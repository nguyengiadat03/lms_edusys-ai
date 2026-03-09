-- Student portfolio aggregating achievements and artifacts

CREATE TABLE IF NOT EXISTS student_portfolio_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NULL,
  item_type ENUM('submission','certificate','badge','assessment','project','other') NOT NULL,
  item_id BIGINT UNSIGNED NULL,
  title VARCHAR(255) NULL,
  description TEXT NULL,
  metadata JSON NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_spi_user (user_id),
  INDEX idx_spi_class (class_id),
  INDEX idx_spi_type (item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

