-- Home page title, meta description and favicon, editable in the visual editor.
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT NOT NULL DEFAULT '';
