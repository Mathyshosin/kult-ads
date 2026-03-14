-- Templates metadata (replaces filesystem-based templates.json)
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'square' CHECK (format IN ('square', 'story')),
  category TEXT NOT NULL DEFAULT 'promo',
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  image_source TEXT NOT NULL DEFAULT 'local' CHECK (image_source IN ('local', 'supabase')),
  tags JSONB DEFAULT '{"industry":[],"adType":[],"productType":[]}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read templates"
  ON templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can insert templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can delete templates"
  ON templates FOR DELETE
  TO authenticated
  USING (true);

-- Storage bucket for template images (new uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone authenticated can upload/read
CREATE POLICY "Anyone authenticated can upload template images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'templates');

CREATE POLICY "Anyone can read template images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'templates');

CREATE POLICY "Anyone authenticated can delete template images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'templates');
