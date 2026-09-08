-- Order of the reorderable home page sections.
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "sectionOrder" TEXT NOT NULL DEFAULT '';
