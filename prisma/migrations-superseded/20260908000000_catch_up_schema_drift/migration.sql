-- Catch-up: everything the schema has that no migration ever created.
--
-- The history in this folder had drifted badly. Twelve tables and 225
-- columns existed in schema.prisma and in the running database but were
-- created by nobody: they had been applied by hand and the folder was never
-- brought up to date. Day to day nothing looked wrong. A first deploy onto
-- an empty database would have failed part way through and left it broken.
--
-- Rather than rewrite the history, which would mean editing rows already
-- recorded against the live database, this adds the missing pieces at the
-- end. Every statement is idempotent, so on the database already running
-- this changes nothing at all, and on an empty one it fills the gap.

-- Enums. CREATE TYPE has no IF NOT EXISTS, so it is guarded.
DO $$ BEGIN
  CREATE TYPE "Plan" AS ENUM ('FREE', 'BASIC', 'PRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables that no migration creates.
CREATE TABLE IF NOT EXISTS "StorePayment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "codEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeAccountId" TEXT,
    "stripeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxName" TEXT NOT NULL DEFAULT 'Tax',

    CONSTRAINT "StorePayment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "StorePage" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorePage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "MediaAsset" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ProductVariantOption" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceOverride" INTEGER,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariantOption_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "StoreCustomer" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreCustomer_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "StoreCustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreCustomerAddress_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "StorePasswordReset" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorePasswordReset_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "DiscountCode" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "minOrder" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ShippingRate" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "minOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedDays" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- Columns missing from tables that were created.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminTheme" TEXT NOT NULL DEFAULT 'system';
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "domainVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "storageUsed" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "footerColor" TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "accentColor" TEXT NOT NULL DEFAULT '#000000';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "textColor" TEXT NOT NULL DEFAULT '#0a0a0a';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "headingFont" TEXT NOT NULL DEFAULT 'serif';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "baseFontSize" INTEGER NOT NULL DEFAULT 16;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "showBanner" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "logoWidth" INTEGER NOT NULL DEFAULT 120;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "borderRadius" TEXT NOT NULL DEFAULT '0px';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "buttonStyle" TEXT NOT NULL DEFAULT 'solid';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "cardShadow" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "dividerStyle" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "showSearch" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "shopAllLabel" TEXT NOT NULL DEFAULT 'Shop All Products';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "featuredLabel" TEXT NOT NULL DEFAULT 'Featured Products';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productGridBg" TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productGridButtonColor" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productGridTextColor" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productGridFont" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productsPageHeading" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productTitleWidth" TEXT NOT NULL DEFAULT 'fill';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productTitleMaxWidth" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productTitleAlign" TEXT NOT NULL DEFAULT 'left';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productTitlePreset" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productTitleBg" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productTitlePaddingTop" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productTitlePaddingBottom" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productTitlePaddingLeft" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productTitlePaddingRight" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productPricePreset" TEXT NOT NULL DEFAULT 'h6';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productPriceWidth" TEXT NOT NULL DEFAULT 'fit';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productPriceAlign" TEXT NOT NULL DEFAULT 'left';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productPriceTextColor" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productPricePaddingTop" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productPricePaddingBottom" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productPricePaddingLeft" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "productPricePaddingRight" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "cartBtnLabel" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "cartBtnShowIcon" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "cartBtnWidth" TEXT NOT NULL DEFAULT 'fill';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "cartBtnFontSize" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "cartBtnPaddingTop" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "cartBtnPaddingBottom" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "cartBtnPaddingLeft" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "cartBtnPaddingRight" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "customCss" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "customHead" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "footerText" TEXT;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "twitterHandle" TEXT;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "heroSlides" JSONB;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "navLinks" JSONB;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "navFontSize" INTEGER NOT NULL DEFAULT 14;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "navCase" TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "navDividers" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "darkMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "showDarkToggle" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catBackLabel" TEXT NOT NULL DEFAULT 'Back to store';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterRadius" TEXT NOT NULL DEFAULT '9999px';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterFontSize" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterFont" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterCase" TEXT NOT NULL DEFAULT 'uppercase';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterActiveBg" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterActiveText" TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterInactiveBg" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterInactiveText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterPaddingX" INTEGER NOT NULL DEFAULT 16;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterPaddingY" INTEGER NOT NULL DEFAULT 6;
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catBackFont" TEXT NOT NULL DEFAULT '';
ALTER TABLE "StoreTheme" ADD COLUMN IF NOT EXISTS "catFilterFontWeight" TEXT NOT NULL DEFAULT 'bold';
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "storeId" TEXT NOT NULL;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "pageId" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "layout" TEXT NOT NULL;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "heading" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "text" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "buttonLabel" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "buttonUrl" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "buttonVariant" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "buttonRadius" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "buttonColor" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "buttonFont" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "showButton" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "bgColor" TEXT;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CustomSection" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageAlt" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "id" TEXT NOT NULL;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "storeId" TEXT NOT NULL;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "slug" TEXT NOT NULL;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerCity" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerCountry" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "taxAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantLabel" TEXT;

-- Indexes. IF NOT EXISTS is supported here.
CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Store_subdomain_key" ON "Store"("subdomain");
CREATE UNIQUE INDEX IF NOT EXISTS "Store_customDomain_key" ON "Store"("customDomain");
CREATE UNIQUE INDEX IF NOT EXISTS "Store_stripeCustomerId_key" ON "Store"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Store_stripeSubscriptionId_key" ON "Store"("stripeSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "StorePayment_storeId_key" ON "StorePayment"("storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "StoreTheme_storeId_key" ON "StoreTheme"("storeId");
CREATE UNIQUE INDEX IF NOT EXISTS "StorePage_storeId_slug_key" ON "StorePage"("storeId", "slug");
CREATE INDEX IF NOT EXISTS "MediaAsset_storeId_createdAt_idx" ON "MediaAsset"("storeId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_storeId_slug_key" ON "Product"("storeId", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_storeId_slug_key" ON "Category"("storeId", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_storeId_email_key" ON "Customer"("storeId", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "StoreCustomer_storeId_email_key" ON "StoreCustomer"("storeId", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "StorePasswordReset_token_key" ON "StorePasswordReset"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "DiscountCode_storeId_code_key" ON "DiscountCode"("storeId", "code");
CREATE INDEX IF NOT EXISTS "ProductReview_productId_status_idx" ON "ProductReview"("productId", "status");
CREATE INDEX IF NOT EXISTS "ProductReview_storeId_status_idx" ON "ProductReview"("storeId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "AiSuggestion_storeId_kind_key" ON "AiSuggestion"("storeId", "kind");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_storeId_createdAt_idx" ON "NewsletterSubscriber"("storeId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_storeId_email_key" ON "NewsletterSubscriber"("storeId", "email");

-- Foreign keys. ADD CONSTRAINT has no IF NOT EXISTS, so each is guarded.
DO $$ BEGIN
  ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StorePayment" ADD CONSTRAINT "StorePayment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StoreTheme" ADD CONSTRAINT "StoreTheme_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "CustomSection" ADD CONSTRAINT "CustomSection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StorePage" ADD CONSTRAINT "StorePage_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StoreCustomer" ADD CONSTRAINT "StoreCustomer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StoreCustomerAddress" ADD CONSTRAINT "StoreCustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "StoreCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
