-- Show or hide the product grid's heading and its "shop all" button.
--
-- Separate from their labels: a blank label is an unnamed thing, not a missing
-- one, and a merchant clearing the text to hide a button had no way back to it.
-- Both default to true, which is what every shop already draws.
ALTER TABLE "StoreTheme" ADD COLUMN "shopAllShow" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreTheme" ADD COLUMN "featuredLabelShow" BOOLEAN NOT NULL DEFAULT true;

-- The grid section's own spacing, in px. Padding is inside the section, so its
-- background covers it; margin is outside, so the page shows through. The
-- padding defaults are the py-6 that used to be a class on the section.
ALTER TABLE "StoreTheme" ADD COLUMN "productGridPadTop" INTEGER NOT NULL DEFAULT 24;
ALTER TABLE "StoreTheme" ADD COLUMN "productGridPadBottom" INTEGER NOT NULL DEFAULT 24;
ALTER TABLE "StoreTheme" ADD COLUMN "productGridPadLeft" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN "productGridPadRight" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN "productGridMarginTop" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN "productGridMarginBottom" INTEGER NOT NULL DEFAULT 0;
