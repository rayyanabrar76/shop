-- The "shop all" button's own spacing, in px.
--
-- Padding is the button itself; margin is the room it keeps from the cards
-- above it and the section's edge below. Defaults are the px-8 py-3 and the
-- pb-8 it was drawn with as classes, so nothing moves.
ALTER TABLE "StoreTheme" ADD COLUMN "shopAllPadTop" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "StoreTheme" ADD COLUMN "shopAllPadBottom" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "StoreTheme" ADD COLUMN "shopAllPadLeft" INTEGER NOT NULL DEFAULT 32;
ALTER TABLE "StoreTheme" ADD COLUMN "shopAllPadRight" INTEGER NOT NULL DEFAULT 32;
ALTER TABLE "StoreTheme" ADD COLUMN "shopAllMarginTop" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN "shopAllMarginBottom" INTEGER NOT NULL DEFAULT 32;
