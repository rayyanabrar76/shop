-- How the hero's call to action is drawn.
--
-- Its label and its destination stay on each slide; this is the one shape they
-- all share. Null means every default, which is exactly what the button did
-- before it could be configured.
ALTER TABLE "StoreTheme" ADD COLUMN "heroButton" JSONB;
