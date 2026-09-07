-- Product layouts are now grid | carousel | editorial, with a separate
-- carousel-on-mobile switch.
--
-- "list" is retired: it was a phone layout rendered on desktop, where it left
-- two thirds of the screen empty. Rows still holding it move to the grid.
UPDATE "StoreTheme" SET "layout" = 'grid' WHERE "layout" = 'list';

ALTER TABLE "StoreTheme"
ADD COLUMN IF NOT EXISTS "carouselOnMobile" BOOLEAN NOT NULL DEFAULT false;
