-- The mobile drawer's contents.
--
-- Null means "everything at its default", which is what every existing shop
-- gets: the menu links, an All products row and the category list, exactly as
-- the drawer was built before it could be configured.
ALTER TABLE "StoreTheme" ADD COLUMN "drawer" JSONB;
