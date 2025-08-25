/*
  Warnings:

  - You are about to drop the column `access_token` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "access_token",
ADD COLUMN     "password" TEXT,
ADD COLUMN     "refresh_token" TEXT,
ALTER COLUMN "device_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."UserCategory" ADD COLUMN     "categoriesName" TEXT[];
