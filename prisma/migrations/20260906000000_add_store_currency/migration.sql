-- Per-store display and settlement currency.
-- Additive and defaulted, so existing stores keep their current USD behaviour.
ALTER TABLE "Store" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
