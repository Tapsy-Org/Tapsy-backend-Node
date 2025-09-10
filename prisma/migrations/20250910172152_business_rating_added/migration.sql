-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "rating_sum" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0;
