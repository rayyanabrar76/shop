-- Default storefront template: monochrome editorial.
-- Only the column defaults change, so every existing theme keeps its own values.
ALTER TABLE "StoreTheme" ALTER COLUMN "primaryColor" SET DEFAULT '#0a0a0a';
ALTER TABLE "StoreTheme" ALTER COLUMN "textColor"    SET DEFAULT '#0a0a0a';
ALTER TABLE "StoreTheme" ALTER COLUMN "footerColor"  SET DEFAULT '#ffffff';
ALTER TABLE "StoreTheme" ALTER COLUMN "headingFont"  SET DEFAULT 'serif';
ALTER TABLE "StoreTheme" ALTER COLUMN "borderRadius" SET DEFAULT '0px';
