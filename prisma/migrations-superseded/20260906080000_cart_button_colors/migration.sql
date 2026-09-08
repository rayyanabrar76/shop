-- Dedicated Add to Cart button colours. Blank keeps the existing behaviour of
-- inheriting the grid button colour, so nothing changes for existing stores.
ALTER TABLE "StoreTheme" ADD COLUMN "cartBtnBgColor"   TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN "cartBtnTextColor" TEXT NOT NULL DEFAULT '';
