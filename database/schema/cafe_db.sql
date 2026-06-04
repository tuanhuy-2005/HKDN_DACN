-- TuanHuy cafe schema (MySQL/MariaDB)

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS menu_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(190) NOT NULL,
  price INT UNSIGNED NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_menu_name (name),
  KEY idx_menu_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reservations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INT UNSIGNED NOT NULL,
  notes TEXT NULL,
  status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_reservations_user_id (user_id),
  KEY idx_reservations_date (reservation_date),
  CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  reservation_id INT UNSIGNED NULL,
  code VARCHAR(40) NOT NULL,
  status ENUM('draft','paid','cancelled') NOT NULL DEFAULT 'draft',
  payment_method ENUM('cash','banking','momo') NULL,
  subtotal INT UNSIGNED NOT NULL DEFAULT 0,
  total INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoices_code (code),
  KEY idx_invoices_user_id (user_id),
  CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invoice_details (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id INT UNSIGNED NOT NULL,
  menu_item_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price INT UNSIGNED NOT NULL,
  line_total INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_invoice_details_invoice_id (invoice_id),
  KEY idx_invoice_details_menu_item_id (menu_item_id),
  CONSTRAINT fk_invoice_details_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_invoice_details_menu_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
