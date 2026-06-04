-- SQLite TuanHuy cafe Management System Schema
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin','user')) NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT NULL,
  image_url TEXT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_name ON menu_items(name);
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu_items(category);

-- 3. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  reservation_date TEXT NOT NULL,
  reservation_time TEXT NOT NULL,
  guests INTEGER NOT NULL,
  notes TEXT NULL,
  status TEXT CHECK(status IN ('pending','confirmed','cancelled')) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);

-- 4. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NULL,
  reservation_id INTEGER NULL,
  code TEXT NOT NULL,
  status TEXT CHECK(status IN ('draft','paid','cancelled')) NOT NULL DEFAULT 'draft',
  payment_method TEXT CHECK(payment_method IN ('cash','banking','momo')) NULL,
  subtotal INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NULL,
  UNIQUE(code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

-- 5. Invoice Details Table
CREATE TABLE IF NOT EXISTS invoice_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  menu_item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoice_details_invoice_id ON invoice_details(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_details_menu_item_id ON invoice_details(menu_item_id);

-- (Removed seed menu items to avoid demo data)
