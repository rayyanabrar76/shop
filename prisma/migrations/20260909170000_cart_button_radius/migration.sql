-- Corners for the quick-add chip.
--
-- It was a full pill in code with no way to change it. Blank keeps that, so
-- every existing shop looks exactly as it did.
ALTER TABLE "StoreTheme" ADD COLUMN "cartBtnRadius" TEXT NOT NULL DEFAULT '';
