-- 001_init_schema.sql
-- Migration: Create initial schema for pickups, addresses, business_hours, insulins, and availabilities

-- Table: addresses
CREATE TABLE addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  street TEXT,
  lat REAL,
  lng REAL
);

-- Table: pickups
CREATE TABLE pickups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  address_id INTEGER NOT NULL,
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE CASCADE
);

CREATE INDEX idx_pickups_address_id ON pickups(address_id);

-- Table: business_hours
CREATE TABLE business_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  open_time TEXT NOT NULL,      -- e.g., '09:00'
  close_time TEXT NOT NULL,     -- e.g., '17:00'
  FOREIGN KEY (pickup_id) REFERENCES pickups(id) ON DELETE CASCADE
);

CREATE INDEX idx_business_hours_pickup_id ON business_hours(pickup_id);

-- Table: insulins
CREATE TABLE insulins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  simpleName TEXT NOT NULL,
  type TEXT NOT NULL -- e.g., 'CANETA', 'AMPOLA', 'REFILL'
);

-- Table: availabilities
CREATE TABLE availabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER NOT NULL,
  insulin_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  availabilityLevel INTEGER NOT NULL, -- 0=unknown, 1=low, 2=medium, 3=high
  checked_at TEXT NOT NULL,
  FOREIGN KEY (pickup_id) REFERENCES pickups(id) ON DELETE CASCADE,
  FOREIGN KEY (insulin_id) REFERENCES insulins(id),
  UNIQUE(pickup_id, insulin_id, checked_at)
);

CREATE INDEX idx_availabilities_pickup_id ON availabilities(pickup_id);
CREATE INDEX idx_availabilities_insulin_id ON availabilities(insulin_id);
CREATE INDEX idx_availabilities_checked_at ON availabilities(checked_at);
