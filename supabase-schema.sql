-- ═══════════════════════════════════════════
-- Kult-ads Supabase Schema
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════

-- Table: brand_analyses
CREATE TABLE brand_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  brand_description TEXT,
  tone TEXT,
  colors TEXT[] DEFAULT '{}',
  target_audience TEXT,
  unique_selling_points TEXT[] DEFAULT '{}',
  competitor_products TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_analysis_id UUID NOT NULL REFERENCES brand_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  original_price TEXT,
  sale_price TEXT,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: offers
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_analysis_id UUID NOT NULL REFERENCES brand_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT,
  discount_value TEXT,
  original_price TEXT,
  sale_price TEXT,
  product_local_id TEXT,
  valid_until TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: generated_ads
CREATE TABLE generated_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_analysis_id UUID REFERENCES brand_analyses(id) ON DELETE SET NULL,
  format TEXT NOT NULL CHECK (format IN ('square', 'story')),
  image_path TEXT NOT NULL,
  headline TEXT,
  body_text TEXT,
  call_to_action TEXT,
  product_local_id TEXT,
  offer_local_id TEXT,
  template_id TEXT,
  is_favorite BOOLEAN DEFAULT false,
  debug_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: uploaded_images
CREATE TABLE uploaded_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_analysis_id UUID REFERENCES brand_analyses(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  name TEXT NOT NULL,
  product_local_id TEXT,
  is_logo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: user_subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  credits_remaining INT NOT NULL DEFAULT 0,
  credits_monthly INT NOT NULL DEFAULT 0,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ═══════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════
ALTER TABLE brand_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own brand_analyses"
  ON brand_analyses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own products"
  ON products FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own offers"
  ON offers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own generated_ads"
  ON generated_ads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own uploaded_images"
  ON uploaded_images FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════
-- Updated_at trigger
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brand_analyses_updated_at
  BEFORE UPDATE ON brand_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════
-- Storage Buckets (create via Supabase dashboard or CLI)
-- ═══════════════════════════════════════════
-- Bucket: user-images (product images + logos)
-- Bucket: generated-ads (generated ad images)

INSERT INTO storage.buckets (id, name, public) VALUES ('user-images', 'user-images', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-ads', 'generated-ads', false);

-- Storage RLS
CREATE POLICY "Users manage own images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'user-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'user-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users manage own ads"
  ON storage.objects FOR ALL
  USING (bucket_id = 'generated-ads' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'generated-ads' AND (storage.foldername(name))[1] = auth.uid()::text);
