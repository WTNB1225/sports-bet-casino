/*
  Warnings:

  - A unique constraint covering the columns `[eventId,marketType,line]` on the table `Market` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `marketType` on the `Market` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MarketType" AS ENUM ('H2H', 'TOTAL', 'SPREAD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventStatus" ADD VALUE 'POSTPONED';
ALTER TYPE "EventStatus" ADD VALUE 'CANCELED';

-- DropIndex
DROP INDEX "Market_eventId_marketType_key";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "line" DECIMAL(6,2) NOT NULL DEFAULT 0,
DROP COLUMN "marketType",
ADD COLUMN     "marketType" "MarketType" NOT NULL;

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Score_eventId_key" ON "Score"("eventId");

-- CreateIndex
CREATE INDEX "Market_eventId_marketType_idx" ON "Market"("eventId", "marketType");

-- CreateIndex
CREATE UNIQUE INDEX "Market_eventId_marketType_line_key" ON "Market"("eventId", "marketType", "line");

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
