-- Per-card image corner radius, independent of the global theme curvature.
-- Blank means "follow the global borderRadius", so existing themes are unchanged.
ALTER TABLE "StoreTheme" ADD COLUMN "productImageRadius" TEXT NOT NULL DEFAULT '';
