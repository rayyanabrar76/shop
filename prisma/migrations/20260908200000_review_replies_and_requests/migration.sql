-- A shop can answer a review, and a shopper gets asked for one.
--
-- Both nullable and both new, so nothing existing has to be backfilled and
-- no row changes meaning.

-- The shop's public answer, shown under the review on the storefront.
ALTER TABLE "ProductReview" ADD COLUMN "reply" TEXT,
                            ADD COLUMN "repliedAt" TIMESTAMP(3);

-- Stamped when the review request goes out, so an order is asked once and
-- never again however often the job runs.
ALTER TABLE "Order" ADD COLUMN "reviewRequestedAt" TIMESTAMP(3);
