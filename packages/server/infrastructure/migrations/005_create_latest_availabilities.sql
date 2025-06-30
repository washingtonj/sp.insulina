-- 005_create_latest_availabilities.sql
-- Migration: Create table to store only the latest availability per pickup
-- and add unique constraint on (pickup_id, checked_at) to availabilities table for upsert support

PRAGMA foreign_keys=off;

-- Create latest_availabilities table if it doesn't exist
CREATE TABLE IF NOT EXISTS latest_availabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER NOT NULL UNIQUE,
  checked_at TEXT NOT NULL,
  data TEXT NOT NULL,
  FOREIGN KEY (pickup_id) REFERENCES pickups(id) ON DELETE CASCADE
);

-- Add unique constraint for upsert support on availabilities
CREATE UNIQUE INDEX IF NOT EXISTS uniq_availabilities_pickup_id_checked_at
  ON availabilities (pickup_id, checked_at);

PRAGMA foreign_keys=on;
