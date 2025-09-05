/*
  Warnings:

  - You are about to drop the column `followType` on the `Follow` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,reviewId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Follow" DROP COLUMN "followType";

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_reviewId_key" ON "public"."Like"("userId", "reviewId");
