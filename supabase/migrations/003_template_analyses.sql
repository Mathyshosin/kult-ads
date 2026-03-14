-- Template analysis metadata (pre-computed by Claude, stored for reliability)
CREATE TABLE IF NOT EXISTS template_analyses (
  template_id TEXT PRIMARY KEY,
  analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow authenticated users to read
ALTER TABLE template_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read template analyses"
  ON template_analyses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can insert template analyses"
  ON template_analyses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update template analyses"
  ON template_analyses FOR UPDATE
  TO authenticated
  USING (true);
