CREATE TABLE IF NOT EXISTS product_events (
  id serial PRIMARY KEY,
  name text NOT NULL,
  session_id text,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_events_name_occurred_at
  ON product_events (name, occurred_at DESC);
