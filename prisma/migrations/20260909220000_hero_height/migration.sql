-- How tall the hero stands, as a share of the window.
--
-- A share rather than pixels, so the same setting means the same thing on a
-- phone and a monitor. 60 is the default because it is what the old fixed
-- 460px came to on a typical screen, so no existing shop moves.
ALTER TABLE "StoreTheme" ADD COLUMN "heroHeight" INTEGER NOT NULL DEFAULT 60;
