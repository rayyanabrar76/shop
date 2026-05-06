-- CreateTable
CREATE TABLE "StoreTheme" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#6c47ff',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "font" TEXT NOT NULL DEFAULT 'sans',
    "bannerText" TEXT NOT NULL DEFAULT 'Welcome to our store',
    "layout" TEXT NOT NULL DEFAULT 'grid',

    CONSTRAINT "StoreTheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreTheme_storeId_key" ON "StoreTheme"("storeId");

-- AddForeignKey
ALTER TABLE "StoreTheme" ADD CONSTRAINT "StoreTheme_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
