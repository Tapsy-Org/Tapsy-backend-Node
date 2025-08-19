/*
  Warnings:

  - You are about to drop the `BusinessDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPersonalization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserSelections` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."ReviewRating" AS ENUM ('BAD', 'EXCELLENT', 'OUTSTANDING');

-- CreateEnum
CREATE TYPE "public"."ReelShareType" AS ENUM ('COPY_LINK', 'DIRECT_USER', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."BusinessDetails" DROP CONSTRAINT "BusinessDetails_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserSelections" DROP CONSTRAINT "_UserSelections_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserSelections" DROP CONSTRAINT "_UserSelections_B_fkey";

-- DropTable
DROP TABLE "public"."BusinessDetails";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."UserPersonalization";

-- DropTable
DROP TABLE "public"."_UserSelections";

-- DropEnum
DROP TYPE "public"."UserStatus";

-- CreateTable
CREATE TABLE "public"."IndividualUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "otp" TEXT,
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "refresh_token" TEXT,
    "device_id" TEXT,
    "user_type" "public"."UserType" NOT NULL DEFAULT 'INDIVIDUAL',
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "firebase_token" TEXT NOT NULL,

    CONSTRAINT "IndividualUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessUser" (
    "id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "tags" TEXT[],
    "mobile_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "zip_code" TEXT,
    "website" TEXT,
    "about" TEXT,
    "bio" TEXT,
    "logo_url" TEXT,
    "video_urls" TEXT[],
    "otp" TEXT,
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "refresh_token" TEXT,
    "device_id" TEXT,
    "user_type" "public"."UserType" NOT NULL DEFAULT 'BUSINESS',
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,
    "firebase_token" TEXT NOT NULL,

    CONSTRAINT "BusinessUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IndividualUserSubCategory" (
    "id" TEXT NOT NULL,
    "individual_user_id" TEXT NOT NULL,
    "sub_category_id" TEXT NOT NULL,

    CONSTRAINT "IndividualUserSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" TEXT NOT NULL,
    "name" "public"."LocationType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IndividualUserLocation" (
    "id" TEXT NOT NULL,
    "individualUserId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "IndividualUserLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reel" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "videoUrl" TEXT,
    "businessId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReelVideo" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,

    CONSTRAINT "ReelVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReelTag" (
    "reelId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ReelTag_pkey" PRIMARY KEY ("reelId","tagId")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "rating" "public"."ReviewRating" NOT NULL,
    "comment" TEXT,
    "businessId" TEXT,
    "reelId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingUserId" TEXT,
    "followingBusinessId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'FOLLOWING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecentSearch" (
    "id" TEXT NOT NULL,
    "individualUserId" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReelView" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReelComment" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReelComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReelShare" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareType" "public"."ReelShareType" NOT NULL,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReelShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_slug_key" ON "public"."SubCategory"("slug");

-- AddForeignKey
ALTER TABLE "public"."BusinessUser" ADD CONSTRAINT "BusinessUser_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IndividualUserSubCategory" ADD CONSTRAINT "IndividualUserSubCategory_individual_user_id_fkey" FOREIGN KEY ("individual_user_id") REFERENCES "public"."IndividualUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IndividualUserSubCategory" ADD CONSTRAINT "IndividualUserSubCategory_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "public"."SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IndividualUserLocation" ADD CONSTRAINT "IndividualUserLocation_individualUserId_fkey" FOREIGN KEY ("individualUserId") REFERENCES "public"."IndividualUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IndividualUserLocation" ADD CONSTRAINT "IndividualUserLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reel" ADD CONSTRAINT "Reel_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."BusinessUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reel" ADD CONSTRAINT "Reel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."IndividualUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelVideo" ADD CONSTRAINT "ReelVideo_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "public"."Reel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelTag" ADD CONSTRAINT "ReelTag_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "public"."Reel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelTag" ADD CONSTRAINT "ReelTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."BusinessUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "public"."Reel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."IndividualUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."IndividualUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followingUserId_fkey" FOREIGN KEY ("followingUserId") REFERENCES "public"."IndividualUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followingBusinessId_fkey" FOREIGN KEY ("followingBusinessId") REFERENCES "public"."BusinessUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecentSearch" ADD CONSTRAINT "RecentSearch_individualUserId_fkey" FOREIGN KEY ("individualUserId") REFERENCES "public"."IndividualUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelView" ADD CONSTRAINT "ReelView_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "public"."Reel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelView" ADD CONSTRAINT "ReelView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."IndividualUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelComment" ADD CONSTRAINT "ReelComment_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "public"."Reel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelComment" ADD CONSTRAINT "ReelComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."IndividualUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelShare" ADD CONSTRAINT "ReelShare_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "public"."Reel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelShare" ADD CONSTRAINT "ReelShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."IndividualUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReelShare" ADD CONSTRAINT "ReelShare_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."IndividualUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
