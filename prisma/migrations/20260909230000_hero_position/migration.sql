-- Where the hero's words sit in the band.
--
-- "x-y": left|center|right and top|middle|bottom. The default is where they
-- always were, so no existing shop moves.
ALTER TABLE "StoreTheme" ADD COLUMN "heroPosition" TEXT NOT NULL DEFAULT 'left-middle';
