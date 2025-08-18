/*
  Warnings:

  - You are about to drop the column `otp` on the `IndividualUser` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."IndividualUser" DROP COLUMN "otp",
ALTER COLUMN "otp_verified" SET DEFAULT true;
