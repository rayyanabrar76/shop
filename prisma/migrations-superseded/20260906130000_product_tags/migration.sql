-- Search keywords for a product. Defaults to an empty array so existing rows
-- stay valid without a backfill.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
