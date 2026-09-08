-- Baseline: the whole schema, as one migration.
--
-- The history that preceded this one had stopped describing the database.
-- Twelve tables and 225 columns lived in schema.prisma and in the running
-- database but were created by no migration: they had been applied by hand
-- and the folder was never caught up. Day to day nothing looked wrong,
-- because the database already had them.
--
-- A first deploy onto an empty database could not work. It failed twice over:
-- one migration altered a StoreTheme column nothing creates, and another
-- inserted into a CustomSection table nothing creates. Adding the missing
-- pieces at the end could not fix that, because the breaks are in the middle
-- and depend on tables that would not exist until afterwards.
--
-- So the history is replaced by its result. This file is
-- , which means it is exactly
-- what schema.prisma describes, and it is verified by scripts/verify-migrations.mjs
-- building a scratch database from it and diffing the result back.
--
-- The 25 migrations it replaces are in prisma/migrations-superseded and in git
-- history at 61c2ab9. The database already running records them as applied;
-- see prisma/MIGRATIONS.md for the one-time step that reconciles it.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'BASIC', 'PRO');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "adminTheme" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "country" TEXT NOT NULL DEFAULT '',
    "customDomain" TEXT,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "storageUsed" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorePayment" (
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

-- CreateTable
CREATE TABLE "StoreTheme" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#0a0a0a',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "footerColor" TEXT NOT NULL DEFAULT '#ffffff',
    "accentColor" TEXT NOT NULL DEFAULT '#000000',
    "textColor" TEXT NOT NULL DEFAULT '#0a0a0a',
    "font" TEXT NOT NULL DEFAULT 'sans',
    "headingFont" TEXT NOT NULL DEFAULT 'serif',
    "baseFontSize" INTEGER NOT NULL DEFAULT 16,
    "bannerText" TEXT NOT NULL DEFAULT 'Welcome to our store',
    "showBanner" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "logoWidth" INTEGER NOT NULL DEFAULT 120,
    "logoHeight" INTEGER NOT NULL DEFAULT 48,
    "headerLayout" TEXT NOT NULL DEFAULT 'left',
    "footerLogoUrl" TEXT NOT NULL DEFAULT '',
    "footerLogoWidth" INTEGER NOT NULL DEFAULT 130,
    "footerLogoHeight" INTEGER NOT NULL DEFAULT 56,
    "menuPosition" TEXT NOT NULL DEFAULT 'auto',
    "headerWidth" TEXT NOT NULL DEFAULT 'page',
    "headerHeight" TEXT NOT NULL DEFAULT 'standard',
    "headerSticky" BOOLEAN NOT NULL DEFAULT true,
    "headerBorderWidth" INTEGER NOT NULL DEFAULT 1,
    "headerBgColor" TEXT NOT NULL DEFAULT '',
    "headerTextColor" TEXT NOT NULL DEFAULT '',
    "utilityStyle" TEXT NOT NULL DEFAULT 'icons',
    "headerTransparent" BOOLEAN NOT NULL DEFAULT false,
    "headerInverseLogoUrl" TEXT NOT NULL DEFAULT '',
    "headerTransparentText" TEXT NOT NULL DEFAULT '#ffffff',
    "cartBtnBgColor" TEXT NOT NULL DEFAULT '',
    "cartBtnTextColor" TEXT NOT NULL DEFAULT '',
    "cartBtnDisplay" TEXT NOT NULL DEFAULT 'icon',
    "layout" TEXT NOT NULL DEFAULT 'grid',
    "carouselOnMobile" BOOLEAN NOT NULL DEFAULT false,
    "borderRadius" TEXT NOT NULL DEFAULT '0px',
    "buttonStyle" TEXT NOT NULL DEFAULT 'solid',
    "cardShadow" TEXT NOT NULL DEFAULT 'none',
    "dividerStyle" TEXT NOT NULL DEFAULT 'none',
    "showSearch" BOOLEAN NOT NULL DEFAULT true,
    "shopAllLabel" TEXT NOT NULL DEFAULT 'Shop All Products',
    "featuredLabel" TEXT NOT NULL DEFAULT 'Featured Products',
    "featuredLabelLevel" TEXT NOT NULL DEFAULT '',
    "productGridBg" TEXT NOT NULL DEFAULT '#ffffff',
    "productImageRadius" TEXT NOT NULL DEFAULT '',
    "productGridButtonColor" TEXT NOT NULL DEFAULT '',
    "productGridTextColor" TEXT NOT NULL DEFAULT '',
    "productGridFont" TEXT NOT NULL DEFAULT '',
    "productsPageHeading" TEXT NOT NULL DEFAULT '',
    "productTitleWidth" TEXT NOT NULL DEFAULT 'fill',
    "productTitleMaxWidth" TEXT NOT NULL DEFAULT '',
    "productTitleAlign" TEXT NOT NULL DEFAULT 'left',
    "productTitlePreset" TEXT NOT NULL DEFAULT 'default',
    "productTitleBg" TEXT NOT NULL DEFAULT '',
    "productTitlePaddingTop" INTEGER NOT NULL DEFAULT 4,
    "productTitlePaddingBottom" INTEGER NOT NULL DEFAULT 0,
    "productTitlePaddingLeft" INTEGER NOT NULL DEFAULT 0,
    "productTitlePaddingRight" INTEGER NOT NULL DEFAULT 0,
    "productPricePreset" TEXT NOT NULL DEFAULT 'h6',
    "productPriceWidth" TEXT NOT NULL DEFAULT 'fit',
    "productPriceAlign" TEXT NOT NULL DEFAULT 'left',
    "productPriceTextColor" TEXT NOT NULL DEFAULT '',
    "productPricePaddingTop" INTEGER NOT NULL DEFAULT 0,
    "productPricePaddingBottom" INTEGER NOT NULL DEFAULT 0,
    "productPricePaddingLeft" INTEGER NOT NULL DEFAULT 0,
    "productPricePaddingRight" INTEGER NOT NULL DEFAULT 0,
    "cartBtnLabel" TEXT NOT NULL DEFAULT '',
    "cartBtnShowIcon" BOOLEAN NOT NULL DEFAULT true,
    "cartBtnWidth" TEXT NOT NULL DEFAULT 'fill',
    "cartBtnFontSize" INTEGER NOT NULL DEFAULT 10,
    "cartBtnPaddingTop" INTEGER NOT NULL DEFAULT 5,
    "cartBtnPaddingBottom" INTEGER NOT NULL DEFAULT 5,
    "cartBtnPaddingLeft" INTEGER NOT NULL DEFAULT 0,
    "cartBtnPaddingRight" INTEGER NOT NULL DEFAULT 0,
    "customCss" TEXT NOT NULL DEFAULT '',
    "customHead" TEXT NOT NULL DEFAULT '',
    "footerText" TEXT,
    "seoTitle" TEXT NOT NULL DEFAULT '',
    "seoDescription" TEXT NOT NULL DEFAULT '',
    "faviconUrl" TEXT NOT NULL DEFAULT '',
    "sectionOrder" TEXT NOT NULL DEFAULT '',
    "footerNewsletter" BOOLEAN NOT NULL DEFAULT true,
    "footerNewsletterHeading" TEXT NOT NULL DEFAULT '',
    "footerNewsletterText" TEXT NOT NULL DEFAULT '',
    "footerShowLinks" BOOLEAN NOT NULL DEFAULT true,
    "instagramHandle" TEXT,
    "twitterHandle" TEXT,
    "facebookUrl" TEXT,
    "heroSlides" JSONB,
    "navLinks" JSONB,
    "navFontSize" INTEGER NOT NULL DEFAULT 14,
    "navCase" TEXT NOT NULL DEFAULT 'normal',
    "navDividers" BOOLEAN NOT NULL DEFAULT false,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "showDarkToggle" BOOLEAN NOT NULL DEFAULT true,
    "catBackLabel" TEXT NOT NULL DEFAULT 'Back to store',
    "catFilterRadius" TEXT NOT NULL DEFAULT '9999px',
    "catFilterFontSize" INTEGER NOT NULL DEFAULT 12,
    "catFilterFont" TEXT NOT NULL DEFAULT '',
    "catFilterCase" TEXT NOT NULL DEFAULT 'uppercase',
    "catFilterActiveBg" TEXT NOT NULL DEFAULT '',
    "catFilterActiveText" TEXT NOT NULL DEFAULT '#ffffff',
    "catFilterInactiveBg" TEXT NOT NULL DEFAULT '',
    "catFilterInactiveText" TEXT NOT NULL DEFAULT '',
    "catFilterPaddingX" INTEGER NOT NULL DEFAULT 16,
    "catFilterPaddingY" INTEGER NOT NULL DEFAULT 6,
    "catBackFont" TEXT NOT NULL DEFAULT '',
    "catFilterFontWeight" TEXT NOT NULL DEFAULT 'bold',

    CONSTRAINT "StoreTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomSection" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "pageId" TEXT,
    "name" TEXT NOT NULL,
    "layout" TEXT NOT NULL,
    "heading" TEXT,
    "text" TEXT,
    "imageUrl" TEXT,
    "buttonLabel" TEXT,
    "buttonUrl" TEXT,
    "buttonVariant" TEXT,
    "buttonRadius" TEXT,
    "buttonColor" TEXT,
    "buttonFont" TEXT,
    "showButton" BOOLEAN NOT NULL DEFAULT false,
    "categoryIds" TEXT NOT NULL DEFAULT '',
    "showCount" BOOLEAN NOT NULL DEFAULT false,
    "bgColor" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorePage" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
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

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "inventory" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "category" TEXT,
    "sku" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slug" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "imageAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerAddress" TEXT,
    "customerCity" TEXT,
    "customerCountry" TEXT,
    "paymentMethod" TEXT,
    "stripeSessionId" TEXT,
    "notes" TEXT,
    "discountCode" TEXT,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "shippingAmount" INTEGER NOT NULL DEFAULT 0,
    "shippingMethod" TEXT,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "variantLabel" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantOption" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceOverride" INTEGER,
    "inventory" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreCustomer" (
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

-- CreateTable
CREATE TABLE "StoreCustomerAddress" (
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

-- CreateTable
CREATE TABLE "StorePasswordReset" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorePasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCode" (
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

-- CreateTable
CREATE TABLE "ShippingRate" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "minOrder" INTEGER NOT NULL DEFAULT 0,
    "estimatedDays" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
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

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Store_subdomain_key" ON "Store"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Store_customDomain_key" ON "Store"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Store_stripeCustomerId_key" ON "Store"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_stripeSubscriptionId_key" ON "Store"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "StorePayment_storeId_key" ON "StorePayment"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreTheme_storeId_key" ON "StoreTheme"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StorePage_storeId_slug_key" ON "StorePage"("storeId", "slug");

-- CreateIndex
CREATE INDEX "MediaAsset_storeId_createdAt_idx" ON "MediaAsset"("storeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_slug_key" ON "Product"("storeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_storeId_slug_key" ON "Category"("storeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_storeId_email_key" ON "Customer"("storeId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "StoreCustomer_storeId_email_key" ON "StoreCustomer"("storeId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "StorePasswordReset_token_key" ON "StorePasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_storeId_code_key" ON "DiscountCode"("storeId", "code");

-- CreateIndex
CREATE INDEX "ProductReview_productId_status_idx" ON "ProductReview"("productId", "status");

-- CreateIndex
CREATE INDEX "ProductReview_storeId_status_idx" ON "ProductReview"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AiSuggestion_storeId_kind_key" ON "AiSuggestion"("storeId", "kind");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_storeId_createdAt_idx" ON "NewsletterSubscriber"("storeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_storeId_email_key" ON "NewsletterSubscriber"("storeId", "email");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorePayment" ADD CONSTRAINT "StorePayment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTheme" ADD CONSTRAINT "StoreTheme_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomSection" ADD CONSTRAINT "CustomSection_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorePage" ADD CONSTRAINT "StorePage_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreCustomer" ADD CONSTRAINT "StoreCustomer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreCustomerAddress" ADD CONSTRAINT "StoreCustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "StoreCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingRate" ADD CONSTRAINT "ShippingRate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

