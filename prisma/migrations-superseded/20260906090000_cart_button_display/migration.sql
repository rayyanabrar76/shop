-- How the Add to Cart control appears on a product card.
-- 'always' matches the pre-hover-reveal behaviour and is the new default.
ALTER TABLE "StoreTheme" ADD COLUMN "cartBtnDisplay" TEXT NOT NULL DEFAULT 'always';
