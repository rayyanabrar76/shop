-- Footer: newsletter sign-ups and the settings that drive the footer columns.
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id"        TEXT NOT NULL,
  "storeId"   TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_storeId_email_key" ON "NewsletterSubscriber"("storeId", "email");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_storeId_createdAt_idx" ON "NewsletterSubscriber"("storeId", "createdAt");
ALTER TABLE "NewsletterSubscriber" DROP CONSTRAINT IF EXISTS "NewsletterSubscriber_storeId_fkey";
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "footerNewsletter" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "footerNewsletterHeading" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "footerNewsletterText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "footerShowLinks" BOOLEAN NOT NULL DEFAULT true;
