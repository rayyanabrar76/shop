-- The grid heading's own spacing, and a style of its own for the shop-all
-- button, including one that is not a button at all.
--
-- The heading's margin default is the mb-7 it was drawn with as a class, so
-- nothing moves. A blank button style follows the theme, as it always did.
ALTER TABLE "StoreTheme" ADD COLUMN "featuredLabelPadTop" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN "featuredLabelPadBottom" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN "featuredLabelPadLeft" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN "featuredLabelPadRight" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN "featuredLabelMarginTop" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN "featuredLabelMarginBottom" INTEGER NOT NULL DEFAULT 28;
ALTER TABLE "StoreTheme" ADD COLUMN "shopAllStyle" TEXT NOT NULL DEFAULT '';
