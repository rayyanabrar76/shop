-- Footer logo. Blank footerLogoUrl means the footer reuses the header logo, so
-- setting a logo once covers both without any extra step.
ALTER TABLE "StoreTheme" ADD COLUMN "footerLogoUrl"    TEXT    NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN "footerLogoWidth"  INTEGER NOT NULL DEFAULT 130;
ALTER TABLE "StoreTheme" ADD COLUMN "footerLogoHeight" INTEGER NOT NULL DEFAULT 56;
