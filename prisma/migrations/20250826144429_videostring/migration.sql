-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "video_urls" DROP NOT NULL,
ALTER COLUMN "video_urls" SET DATA TYPE TEXT;
