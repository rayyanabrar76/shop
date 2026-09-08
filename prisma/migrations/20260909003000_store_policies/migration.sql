-- Policies become their own table, and stop being ordinary pages.
--
-- Refund, privacy, terms and shipping were StorePage rows, indistinguishable
-- from About Us. Nothing knew they were policies, so the checkout linked to
-- none of them and the footer could only hide one by it being blank. They are
-- a fixed set, so they get one row per kind per shop.

CREATE TABLE "StorePolicy" (
    "id"        TEXT NOT NULL,
    "storeId"   TEXT NOT NULL,
    "kind"      TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "content"   TEXT NOT NULL DEFAULT '',
    "visible"   BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePolicy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StorePolicy_storeId_kind_key" ON "StorePolicy"("storeId", "kind");

ALTER TABLE "StorePolicy"
    ADD CONSTRAINT "StorePolicy_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry the existing policy pages across as they are, prompts and all. The
-- page body was plain text under content.content, so nothing is lost in the
-- move; whether a policy is still the untouched starter is decided by the
-- application against the same starter text it always compared to.
--
-- Ids are derived rather than random so the statement is safe to re-run
-- against a partial state: the same store and kind always produce the same
-- id, and the unique index refuses a duplicate.
INSERT INTO "StorePolicy" ("id", "storeId", "kind", "title", "content", "visible", "createdAt", "updatedAt")
SELECT DISTINCT ON (p."storeId", p."type")
       'pol_' || md5(p."storeId" || ':' || p."type"),
       p."storeId",
       p."type",
       p."name",
       COALESCE(p."content"->>'content', ''),
       true,
       p."createdAt",
       CURRENT_TIMESTAMP
FROM "StorePage" p
WHERE p."type" IN ('refund', 'privacy', 'terms', 'shipping')
ORDER BY p."storeId", p."type", p."createdAt" ASC;

-- Every shop gets every kind, including the one that never had a page:
-- contact information. Anything the move above did not supply starts empty.
INSERT INTO "StorePolicy" ("id", "storeId", "kind", "title", "content", "visible", "createdAt", "updatedAt")
SELECT 'pol_' || md5(s."id" || ':' || k.kind),
       s."id",
       k.kind,
       k.title,
       '',
       true,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "Store" s
CROSS JOIN (VALUES
    ('refund',   'Refund Policy'),
    ('privacy',  'Privacy Policy'),
    ('terms',    'Terms of Service'),
    ('shipping', 'Shipping Policy'),
    ('contact',  'Contact Information')
) AS k(kind, title)
WHERE NOT EXISTS (
    SELECT 1 FROM "StorePolicy" sp WHERE sp."storeId" = s."id" AND sp."kind" = k.kind
);

-- The old pages go, and so do any sections that were attached to them, which
-- would otherwise point at a page that no longer exists.
DELETE FROM "CustomSection"
WHERE "pageId" IN (
    SELECT "id" FROM "StorePage" WHERE "type" IN ('refund', 'privacy', 'terms', 'shipping')
);

DELETE FROM "StorePage" WHERE "type" IN ('refund', 'privacy', 'terms', 'shipping');
