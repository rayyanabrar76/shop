-- The cart button had four display modes; it now has two, "icon" and "hidden".
--
-- "always" and "hover" both placed a full-width button under every product
-- card, and "hover" relied on an affordance phones do not have. Both are now
-- rendered as "icon", so existing rows are moved across rather than left
-- holding a value nothing reads.
UPDATE "StoreTheme"
SET "cartBtnDisplay" = 'icon'
WHERE "cartBtnDisplay" IN ('always', 'hover');

-- New stores get the chip.
ALTER TABLE "StoreTheme"
ALTER COLUMN "cartBtnDisplay" SET DEFAULT 'icon';
