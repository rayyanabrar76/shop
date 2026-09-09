-- Cards without a price.
--
-- Some shops quote rather than sell, and some price by weight at the counter,
-- so the number is the wrong thing to put on a card. Defaults to false, which
-- is what every existing shop is already doing.
ALTER TABLE "StoreTheme" ADD COLUMN "productPriceHidden" BOOLEAN NOT NULL DEFAULT false;
