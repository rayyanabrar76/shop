-- Shop-by-category sections can target specific categories and show counts.
-- Blank categoryIds keeps the existing behaviour of showing all of them.
ALTER TABLE "CustomSection" ADD COLUMN "categoryIds" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CustomSection" ADD COLUMN "showCount" BOOLEAN NOT NULL DEFAULT false;
