-- Where the shop trades from, for checkout address defaults.
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT '';
