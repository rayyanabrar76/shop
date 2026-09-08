-- Default storefront template: monochrome editorial.
-- Only the column defaults change, so every existing theme keeps its own values.
--
-- Four of these columns are not created by any migration in this folder. They
-- were added to the running database by hand and only ever existed in
-- schema.prisma, so this file worked where it was written and would have
-- failed on the fourth line of a first deploy to an empty database. The
-- catch-up migration at the end of the folder creates them, but that runs
-- after this one, so each statement checks for its column first.
--
-- Skipping is the right answer rather than an error: a column created later
-- by the catch-up takes its default straight from schema.prisma, which is
-- already the monochrome value this migration was written to set.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'StoreTheme' AND column_name = 'primaryColor') THEN
    ALTER TABLE "StoreTheme" ALTER COLUMN "primaryColor" SET DEFAULT '#0a0a0a';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'StoreTheme' AND column_name = 'textColor') THEN
    ALTER TABLE "StoreTheme" ALTER COLUMN "textColor" SET DEFAULT '#0a0a0a';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'StoreTheme' AND column_name = 'footerColor') THEN
    ALTER TABLE "StoreTheme" ALTER COLUMN "footerColor" SET DEFAULT '#ffffff';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'StoreTheme' AND column_name = 'headingFont') THEN
    ALTER TABLE "StoreTheme" ALTER COLUMN "headingFont" SET DEFAULT 'serif';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'StoreTheme' AND column_name = 'borderRadius') THEN
    ALTER TABLE "StoreTheme" ALTER COLUMN "borderRadius" SET DEFAULT '0px';
  END IF;
END $$;
