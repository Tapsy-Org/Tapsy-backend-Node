/*
  Warnings:

  - You are about to drop the column `refresh_token` on the `IndividualUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."IndividualUser" DROP COLUMN "refresh_token",
ADD COLUMN     "access_token" TEXT;
