-- 004_add_composite_index_availabilities.sql
-- Migration: Add composite index on (pickup_id, checked_at DESC) to availabilities table for efficient latest-row queries

PRAGMA foreign_keys=off;

-- Drop the index if it already exists (defensive, in case of re-run)
DROP INDEX IF EXISTS idx_availabilities_pickup_id_checked_at_desc;

-- Create the composite index for optimized latest-row lookups per pickup
CREATE INDEX idx_availabilities_pickup_id_checked_at_desc
  ON availabilities (pickup_id, checked_at DESC);

PRAGMA foreign_keys=on;
