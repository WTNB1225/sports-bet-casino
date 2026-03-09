/*
  Warnings:

  - A unique constraint covering the columns `[eventId,marketType]` on the table `Market` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[marketId,name]` on the table `Odd` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Odd` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Odd" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Market_eventId_marketType_key" ON "Market"("eventId", "marketType");

-- CreateIndex
CREATE UNIQUE INDEX "Odd_marketId_name_key" ON "Odd"("marketId", "name");
