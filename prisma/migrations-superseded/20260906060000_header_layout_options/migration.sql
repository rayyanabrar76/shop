-- Header layout and appearance controls. Every default reproduces the previous
-- hardcoded behaviour, so existing storefronts render identically.
ALTER TABLE "StoreTheme" ADD COLUMN "menuPosition"      TEXT    NOT NULL DEFAULT 'auto';
ALTER TABLE "StoreTheme" ADD COLUMN "headerWidth"       TEXT    NOT NULL DEFAULT 'page';
ALTER TABLE "StoreTheme" ADD COLUMN "headerHeight"      TEXT    NOT NULL DEFAULT 'standard';
ALTER TABLE "StoreTheme" ADD COLUMN "headerSticky"      BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreTheme" ADD COLUMN "headerBorderWidth" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "StoreTheme" ADD COLUMN "headerBgColor"     TEXT    NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN "headerTextColor"   TEXT    NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN "utilityStyle"      TEXT    NOT NULL DEFAULT 'icons';
