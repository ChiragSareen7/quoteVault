-- Step 1: Create user_quotes table
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

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quotes_user_id ON user_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotes_category ON user_quotes(category);
CREATE INDEX IF NOT EXISTS idx_user_quotes_created_at ON user_quotes(created_at DESC);

-- Step 3: Enable RLS
ALTER TABLE user_quotes ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "User quotes are publicly readable" ON user_quotes;
CREATE POLICY "User quotes are publicly readable"
  ON user_quotes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own quotes" ON user_quotes;
CREATE POLICY "Users can create own quotes"
  ON user_quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quotes" ON user_quotes;
CREATE POLICY "Users can update own quotes"
  ON user_quotes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own quotes" ON user_quotes;
CREATE POLICY "Users can delete own quotes"
  ON user_quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_quotes_updated_at ON user_quotes;
CREATE TRIGGER update_user_quotes_updated_at
  BEFORE UPDATE ON user_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Update collection_quotes to support user_quotes
-- Add user_quote_id column
ALTER TABLE collection_quotes 
  ADD COLUMN IF NOT EXISTS user_quote_id UUID REFERENCES user_quotes(id) ON DELETE CASCADE;

-- Make quote_id nullable (if not already)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'collection_quotes' 
    AND column_name = 'quote_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE collection_quotes ALTER COLUMN quote_id DROP NOT NULL;
  END IF;
END $$;

-- Step 7: Drop old unique constraint if it exists
ALTER TABLE collection_quotes 
  DROP CONSTRAINT IF EXISTS collection_quotes_collection_id_quote_id_key;

-- Step 8: Add check constraint (exactly one of quote_id or user_quote_id must be set)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_quote_or_user_quote'
  ) THEN
    ALTER TABLE collection_quotes 
      ADD CONSTRAINT check_quote_or_user_quote 
        CHECK (
          (quote_id IS NOT NULL AND user_quote_id IS NULL) OR 
          (quote_id IS NULL AND user_quote_id IS NOT NULL)
        );
  END IF;
END $$;

-- Step 9: Create new unique indexes for both quote types
DROP INDEX IF EXISTS collection_quotes_regular_unique;
CREATE UNIQUE INDEX collection_quotes_regular_unique 
  ON collection_quotes(collection_id, quote_id) 
  WHERE quote_id IS NOT NULL;

DROP INDEX IF EXISTS collection_quotes_user_unique;
CREATE UNIQUE INDEX collection_quotes_user_unique 
  ON collection_quotes(collection_id, user_quote_id) 
  WHERE user_quote_id IS NOT NULL;



