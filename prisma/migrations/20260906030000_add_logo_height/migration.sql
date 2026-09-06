-- Cap the logo's rendered height. Sizing by width alone let a tall stacked logo
-- stretch the header to its own aspect ratio.
ALTER TABLE "StoreTheme" ADD COLUMN "logoHeight" INTEGER NOT NULL DEFAULT 48;
