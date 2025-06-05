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
  FOREIGN KEY (address_id) REFERENCES addresses(id)
);

-- Table: business_hours
CREATE TABLE business_hours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  open_time TEXT NOT NULL,      -- e.g., '09:00'
  close_time TEXT NOT NULL,     -- e.g., '17:00'
  FOREIGN KEY (pickup_id) REFERENCES pickups(id)
);

-- Table: insulins
CREATE TABLE insulins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  name TEXT
);

-- Table: availabilities
CREATE TABLE availabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER NOT NULL,
  insulin_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  availabilityLevel INTEGER NOT NULL, -- 0=unknown, 1=low, 2=medium, 3=high
  checked_at DATETIME NOT NULL,
  FOREIGN KEY (pickup_id) REFERENCES pickups(id),
  FOREIGN KEY (insulin_id) REFERENCES insulins(id)
  -- Optionally, add UNIQUE(pickup_id, insulin_id, checked_at) if you want to prevent duplicate samples for the same time
);

-- Optional: Add a unique constraint to prevent duplicate samples for the same pickup, insulin, and timestamp
CREATE UNIQUE INDEX idx_availabilities_unique ON availabilities(pickup_id, insulin_id, checked_at);
