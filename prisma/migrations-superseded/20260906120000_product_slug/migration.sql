-- SEO-friendly product URLs: /products/classic-glazed instead of a cuid.
-- Nullable + backfilled, and lookups still accept an id so existing links work.
ALTER TABLE "Product" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "Product_storeId_slug_key" ON "Product"("storeId", "slug");
