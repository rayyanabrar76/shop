-- Categories get their own image and description, so a Shop by Category tile
-- no longer has to borrow a product photo.
ALTER TABLE "Category" ADD COLUMN "description" TEXT;
ALTER TABLE "Category" ADD COLUMN "imageUrl" TEXT;
