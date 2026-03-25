/*
  Warnings:

  - The values [TOTAL,SPREAD] on the enum `MarketType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MarketType_new" AS ENUM ('H2H', 'TOTALS', 'SPREADS');
ALTER TABLE "Market" ALTER COLUMN "marketType" TYPE "MarketType_new" USING ("marketType"::text::"MarketType_new");
ALTER TYPE "MarketType" RENAME TO "MarketType_old";
ALTER TYPE "MarketType_new" RENAME TO "MarketType";
DROP TYPE "public"."MarketType_old";
COMMIT;
