-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ONBOARDING', 'VERIFIED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."LocationType" AS ENUM ('HOME', 'OFFICE', 'OTHER');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "mobileNumber" TEXT,
    "userType" "public"."UserType",
    "UserName" TEXT,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastCompletedStep" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ONBOARDING',
    "refreshToken" TEXT,
    "lastLogin" TIMESTAMP(3),
    "deviceId" TEXT,
    "businessDetailsId" TEXT,
    "locationType" "public"."LocationType",
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "locationAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "about" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "zipcode" TEXT,
    "category" TEXT,
    "description" TEXT,
    "email" TEXT,
    "mobile" TEXT,
    "logoUrl" TEXT,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPersonalization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "screenType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPersonalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_UserSelections" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserSelections_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobileNumber_key" ON "public"."User"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDetails_userId_key" ON "public"."BusinessDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDetails_email_key" ON "public"."BusinessDetails"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDetails_mobile_key" ON "public"."BusinessDetails"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "UserPersonalization_slug_key" ON "public"."UserPersonalization"("slug");

-- CreateIndex
CREATE INDEX "_UserSelections_B_index" ON "public"."_UserSelections"("B");

-- AddForeignKey
ALTER TABLE "public"."BusinessDetails" ADD CONSTRAINT "BusinessDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserSelections" ADD CONSTRAINT "_UserSelections_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserSelections" ADD CONSTRAINT "_UserSelections_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."UserPersonalization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
