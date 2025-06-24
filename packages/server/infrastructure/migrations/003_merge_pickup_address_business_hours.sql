-- 003_merge_pickup_address_business_hours.sql
-- Migration: Merge address and businessHours into pickups, drop addresses, business_hours, insulins tables, and update pickups schema

PRAGMA foreign_keys=off;

-- 1. Create new pickups table with address and business_hours as JSON columns
CREATE TABLE pickups_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,           -- JSON: { address, latitude, longitude }
  business_hours TEXT NOT NULL     -- JSON: array of { dayOfWeek, hours }
);

-- 2. Migrate data from old pickups, addresses, and business_hours tables
INSERT INTO pickups_new (id, uuid, name, address, business_hours)
SELECT
  p.id,
  p.uuid,
  p.name,
  json_object(
    'address', a.street,
    'latitude', a.lat,
    'longitude', a.lng
  ) AS address,
  COALESCE(
    (
      SELECT
        json_group_array(
          json_object(
            'dayOfWeek', bh.day_of_week,
            'hours', json_array(bh.open_time, bh.close_time)
          )
        )
      FROM business_hours bh
      WHERE bh.pickup_id = p.id
    ),
    '[]'
  ) AS business_hours
FROM pickups p
JOIN addresses a ON p.address_id = a.id;

-- 3. Update availabilities table to reference new pickups table (no change needed if referencing by pickup_id)

-- 4. Drop old pickups, addresses, business_hours, and insulins tables
DROP TABLE IF EXISTS business_hours;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS insulins;
DROP TABLE pickups;

-- 5. Rename new pickups table to pickups
ALTER TABLE pickups_new RENAME TO pickups;

-- 6. Create insulins table for insulin metadata
CREATE TABLE insulins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  simpleName TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'CANETA', 'AMPOLA', 'REFILL'
  variant TEXT NOT NULL -- e.g., 'NPH', 'REGULAR'
);

PRAGMA foreign_keys=on;
