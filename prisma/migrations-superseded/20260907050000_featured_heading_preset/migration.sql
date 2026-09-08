-- Typography preset for the product section heading, as a collection title has
-- in Shopify. Blank keeps the original small-caps label, so every existing
-- store looks exactly as it did.
ALTER TABLE "StoreTheme"
ADD COLUMN IF NOT EXISTS "featuredLabelLevel" TEXT NOT NULL DEFAULT '';
