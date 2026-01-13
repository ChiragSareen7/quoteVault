-- User Quotes Table
-- Allows users to create and manage their own quotes

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quotes_user_id ON user_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotes_category ON user_quotes(category);
CREATE INDEX IF NOT EXISTS idx_user_quotes_created_at ON user_quotes(created_at DESC);

-- RLS Policies for user_quotes
ALTER TABLE user_quotes ENABLE ROW LEVEL SECURITY;

-- Users can view all user quotes (public feed)
CREATE POLICY "User quotes are publicly readable"
  ON user_quotes FOR SELECT
  USING (true);

-- Users can only create their own quotes
CREATE POLICY "Users can create own quotes"
  ON user_quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own quotes
CREATE POLICY "Users can update own quotes"
  ON user_quotes FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own quotes
CREATE POLICY "Users can delete own quotes"
  ON user_quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_quotes_updated_at
  BEFORE UPDATE ON user_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update collection_quotes to support both quotes and user_quotes
-- Add user_quote_id column to reference user_quotes table
ALTER TABLE collection_quotes 
  ADD COLUMN IF NOT EXISTS user_quote_id UUID REFERENCES user_quotes(id) ON DELETE CASCADE;

-- Make quote_id nullable (it was NOT NULL, but we need to allow NULL when using user_quote_id)
ALTER TABLE collection_quotes 
  ALTER COLUMN quote_id DROP NOT NULL;

-- Drop the existing unique constraint
ALTER TABLE collection_quotes 
  DROP CONSTRAINT IF EXISTS collection_quotes_collection_id_quote_id_key;

-- Add constraint to ensure exactly one of quote_id or user_quote_id is set
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_quote_or_user_quote'
  ) THEN
    ALTER TABLE collection_quotes 
      ADD CONSTRAINT check_quote_or_user_quote 
        CHECK ((quote_id IS NOT NULL AND user_quote_id IS NULL) OR 
               (quote_id IS NULL AND user_quote_id IS NOT NULL));
  END IF;
END $$;

-- Create new unique constraints for both quote types
-- For regular quotes
CREATE UNIQUE INDEX IF NOT EXISTS collection_quotes_regular_unique 
  ON collection_quotes(collection_id, quote_id) 
  WHERE quote_id IS NOT NULL;

-- For user quotes  
CREATE UNIQUE INDEX IF NOT EXISTS collection_quotes_user_unique 
  ON collection_quotes(collection_id, user_quote_id) 
  WHERE user_quote_id IS NOT NULL;

-- Update RLS policies to handle user_quotes (existing policies should work)

