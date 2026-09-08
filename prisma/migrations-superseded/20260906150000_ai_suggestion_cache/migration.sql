-- Cached catalogue suggestions, so opening a form does not re-run the model.
CREATE TABLE IF NOT EXISTS "AiSuggestion" (
  "id"          TEXT NOT NULL,
  "storeId"     TEXT NOT NULL,
  "kind"        TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "payload"     JSONB NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AiSuggestion_storeId_kind_key" ON "AiSuggestion"("storeId", "kind");
ALTER TABLE "AiSuggestion" DROP CONSTRAINT IF EXISTS "AiSuggestion_storeId_fkey";
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
