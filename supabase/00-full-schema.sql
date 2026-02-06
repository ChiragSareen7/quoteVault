-- ============================================================================
-- QuoteVault – Full Supabase schema (run this first on a new project)
-- ============================================================================
-- Run this entire file in Supabase Dashboard → SQL Editor → New query.
-- Then run seed.sql to insert 100+ quotes.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES (synced with auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  accent_color TEXT DEFAULT 'blue' CHECK (accent_color IN ('blue', 'purple', 'green', 'orange', 'red')),
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  notification_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- QUOTES (global seed + browse)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('motivation', 'love', 'success', 'wisdom', 'humor')),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_category ON quotes(category);
CREATE INDEX IF NOT EXISTS idx_quotes_author ON quotes(author);
CREATE INDEX IF NOT EXISTS idx_quotes_text_search ON quotes USING gin(to_tsvector('english', text));

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quotes are publicly readable"
  ON quotes FOR SELECT USING (true);
CREATE POLICY "Only admins can modify quotes"
  ON quotes FOR ALL USING (false) WITH CHECK (false);

-- ============================================================================
-- USER_QUOTES (user-created quotes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('motivation', 'love', 'success', 'wisdom', 'humor')),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_quotes_user_id ON user_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotes_category ON user_quotes(category);
CREATE INDEX IF NOT EXISTS idx_user_quotes_created_at ON user_quotes(created_at DESC);

ALTER TABLE user_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User quotes are publicly readable"
  ON user_quotes FOR SELECT USING (true);
CREATE POLICY "Users can create own quotes"
  ON user_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotes"
  ON user_quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotes"
  ON user_quotes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FAVORITES
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quote_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_quote_id ON favorites(quote_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own favorites"
  ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- COLLECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own collections"
  ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- COLLECTION_QUOTES (supports both quotes and user_quotes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS collection_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  user_quote_id UUID REFERENCES user_quotes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_quote_or_user_quote CHECK (
    (quote_id IS NOT NULL AND user_quote_id IS NULL) OR
    (quote_id IS NULL AND user_quote_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_collection_quotes_collection_id ON collection_quotes(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_quotes_quote_id ON collection_quotes(quote_id);
CREATE INDEX IF NOT EXISTS idx_collection_quotes_user_quote_id ON collection_quotes(user_quote_id);

CREATE UNIQUE INDEX IF NOT EXISTS collection_quotes_regular_unique
  ON collection_quotes(collection_id, quote_id) WHERE quote_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS collection_quotes_user_unique
  ON collection_quotes(collection_id, user_quote_id) WHERE user_quote_id IS NOT NULL;

ALTER TABLE collection_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotes in own collections"
  ON collection_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_quotes.collection_id AND collections.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can add quotes to own collections"
  ON collection_quotes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_quotes.collection_id AND collections.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can remove quotes from own collections"
  ON collection_quotes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_quotes.collection_id AND collections.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_quotes_updated_at ON user_quotes;
CREATE TRIGGER update_user_quotes_updated_at
  BEFORE UPDATE ON user_quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
