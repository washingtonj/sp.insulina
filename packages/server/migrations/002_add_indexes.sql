-- 002_add_indexes.sql
-- Migration: Add indexes for faster lookups on pickups(name) and insulins(code)

CREATE INDEX idx_pickups_name ON pickups(name);
CREATE INDEX idx_insulins_code ON insulins(code);