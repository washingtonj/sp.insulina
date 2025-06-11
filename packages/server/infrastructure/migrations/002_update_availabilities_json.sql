-- 002_update_availabilities_json.sql
-- Migration: Update availabilities table to store JSON data per pickup per time slot

PRAGMA foreign_keys=off;

-- 1. Rename the old availabilities table
ALTER TABLE availabilities RENAME TO availabilities_old;

-- 2. Drop old indexes if they exist
DROP INDEX IF EXISTS idx_availabilities_pickup_id;
DROP INDEX IF EXISTS idx_availabilities_insulin_id;
DROP INDEX IF EXISTS idx_availabilities_checked_at;

-- 3. Create the new availabilities table with the new schema
CREATE TABLE availabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pickup_id INTEGER NOT NULL,
  checked_at TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON string with all availabilities for this pickup and time slot
  FOREIGN KEY (pickup_id) REFERENCES pickups(id) ON DELETE CASCADE
);

CREATE INDEX idx_availabilities_pickup_id ON availabilities(pickup_id);
CREATE INDEX idx_availabilities_checked_at ON availabilities(checked_at);

-- 4. Data migration: migrate old data to new JSON format
INSERT INTO availabilities (pickup_id, checked_at, data)
SELECT
  pickup_id,
  checked_at,
  json_group_array(
    json_object(
      'insulinCode', insulins.code,
      'quantity', quantity,
      'level', availabilityLevel
    )
  ) AS data
FROM availabilities_old
JOIN insulins ON availabilities_old.insulin_id = insulins.id
GROUP BY pickup_id, checked_at;

-- 5. Drop the old table
DROP TABLE availabilities_old;

PRAGMA foreign_keys=on;
