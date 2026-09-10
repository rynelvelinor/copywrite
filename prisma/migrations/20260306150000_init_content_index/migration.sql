-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ContentIndex" (
    "id" TEXT NOT NULL,
    "subname" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "originUrl" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContentIndex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentIndex_subname_key" ON "ContentIndex"("subname");

-- CreateIndex
CREATE INDEX "ContentIndex_contentHash_idx" ON "ContentIndex"("contentHash");

-- CreateIndex
CREATE INDEX "ContentIndex_ownerAddress_idx" ON "ContentIndex"("ownerAddress");
