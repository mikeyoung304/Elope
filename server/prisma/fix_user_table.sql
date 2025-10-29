-- Fix User table - add missing passwordHash column
-- This column was added in Phase 2A migration but wasn't in the original schema

-- Add passwordHash column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name = 'passwordHash'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT 'changeme';
        -- Remove default after adding (we want NOT NULL but no default for new rows)
        ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP DEFAULT;
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;
