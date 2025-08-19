/*
  Warnings:

  - You are about to drop the column `access_token` on the `IndividualUser` table. All the data in the column will be lost.
  - You are about to drop the column `firebase_token` on the `IndividualUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."IndividualUser" DROP COLUMN "access_token",
DROP COLUMN "firebase_token";
