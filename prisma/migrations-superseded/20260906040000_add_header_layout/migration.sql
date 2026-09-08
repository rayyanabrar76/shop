-- Header arrangement: logo on the left (default, unchanged) or centred with the
-- nav to its left, which suits stacked or square logos.
ALTER TABLE "StoreTheme" ADD COLUMN "headerLayout" TEXT NOT NULL DEFAULT 'left';
