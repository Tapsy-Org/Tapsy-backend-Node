/*
  Warnings:

  - You are about to drop the column `video_urls` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "public"."Review" ADD COLUMN     "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "video_urls",
ADD COLUMN     "video_url" TEXT;
