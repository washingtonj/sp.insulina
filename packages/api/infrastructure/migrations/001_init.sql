CREATE TABLE IF NOT EXISTS pickups (
  id serial PRIMARY KEY,
  uuid text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  address jsonb NOT NULL,
  business_hours jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS insulins (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  simple_name text NOT NULL,
  type text NOT NULL,
  variant text NOT NULL
);

CREATE TABLE IF NOT EXISTS availabilities (
  id serial PRIMARY KEY,
  pickup_id integer NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL,
  data jsonb NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_availabilities_pickup_id_checked_at
  ON availabilities (pickup_id, checked_at);
CREATE INDEX IF NOT EXISTS idx_availabilities_pickup_id
  ON availabilities (pickup_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_checked_at
  ON availabilities (checked_at);
CREATE INDEX IF NOT EXISTS idx_availabilities_pickup_id_checked_at_desc
  ON availabilities (pickup_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS latest_availabilities (
  id serial PRIMARY KEY,
  pickup_id integer NOT NULL UNIQUE REFERENCES pickups(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL,
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS response_cache (
  key text PRIMARY KEY,
  body jsonb NOT NULL,
  cached_at timestamptz NOT NULL
);
