-- Transparent header over the home page hero, with an inverse logo for contrast.
-- Off by default, so existing storefronts are unchanged.
ALTER TABLE "StoreTheme" ADD COLUMN "headerTransparent"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreTheme" ADD COLUMN "headerInverseLogoUrl"  TEXT    NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN "headerTransparentText" TEXT    NOT NULL DEFAULT '#ffffff';
