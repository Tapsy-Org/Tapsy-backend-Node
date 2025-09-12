-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('INDIVIDUAL', 'BUSINESS', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."VerificationMethod" AS ENUM ('MOBILE', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."LocationType" AS ENUM ('HOME', 'WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."VideoShareType" AS ENUM ('COPY_LINK', 'DIRECT', 'DM');

-- CreateEnum
CREATE TYPE "public"."ReviewRating" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE');

-- CreateEnum
CREATE TYPE "public"."CategoryAudience" AS ENUM ('INDIVIDUAL', 'BUSINESS', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."OnboardingStep" AS ENUM ('REGISTERED', 'CATEGORY', 'LOCATION', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('STRIPE', 'RAZORPAY', 'CARD', 'CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('LIKE', 'COMMENT', 'FOLLOW', 'MESSAGE', 'MENTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."SupportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "user_type" "public"."UserType" NOT NULL,
    "mobile_number" TEXT,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "status" "public"."Status" NOT NULL,
    "last_login" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firebase_token" TEXT,
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_method" "public"."VerificationMethod" NOT NULL,
    "otp" TEXT,
    "refresh_token" TEXT,
    "logo_url" TEXT,
    "otp_expiry" TIMESTAMP(3),
    "about" TEXT,
    "onboarding_step" "public"."OnboardingStep" DEFAULT 'REGISTERED',
    "email" TEXT,
    "video_url" TEXT,
    "website" TEXT,
    "rating_sum" INTEGER NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "password" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "audience" "public"."CategoryAudience" NOT NULL,
    "status" "public"."Status" NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCategory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "categoriesName" TEXT[],
    "subcategories" TEXT[],
    "user_type" "public"."UserType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Location" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "address" TEXT,
    "zip_code" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" TEXT NOT NULL,
    "location_type" "public"."LocationType",
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rating" "public"."ReviewRating" NOT NULL,
    "badges" TEXT,
    "caption" TEXT,
    "hashtags" TEXT[],
    "title" TEXT,
    "video_url" TEXT,
    "businessId" UUID,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReviewFeedback" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "feedback" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Like" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "comment" TEXT NOT NULL,
    "parent_comment_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Follow" (
    "id" UUID NOT NULL,
    "followerId" UUID NOT NULL,
    "followingUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "sender_type" "public"."UserType" NOT NULL,
    "text" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessVideo" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "hashtags" TEXT[],
    "video_url" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "senderId" UUID,
    "type" "public"."NotificationType" NOT NULL,
    "referenceId" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "status" "public"."NotificationStatus" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupportTicket" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "user_type" "public"."UserType" NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."SupportStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecentSearch" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "public"."Status" NOT NULL,
    "searchText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "billingCycle" "public"."BillingCycle" NOT NULL,
    "features" TEXT[],
    "limits" TEXT[],
    "status" "public"."Status" NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "stripe_price_id" TEXT NOT NULL,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "trial_ends_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "payment_method" "public"."PaymentMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QRCode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_number_key" ON "public"."User"("mobile_number");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_user_type_idx" ON "public"."User"("user_type");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "public"."User"("name");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE INDEX "User_user_type_status_idx" ON "public"."User"("user_type", "status");

-- CreateIndex
CREATE INDEX "User_last_login_idx" ON "public"."User"("last_login" DESC);

-- CreateIndex
CREATE INDEX "User_otp_verified_idx" ON "public"."User"("otp_verified");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "public"."Category"("name");

-- CreateIndex
CREATE INDEX "Category_audience_idx" ON "public"."Category"("audience");

-- CreateIndex
CREATE INDEX "Category_status_sort_order_idx" ON "public"."Category"("status", "sort_order");

-- CreateIndex
CREATE INDEX "UserCategory_userId_idx" ON "public"."UserCategory"("userId");

-- CreateIndex
CREATE INDEX "UserCategory_categoryId_idx" ON "public"."UserCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCategory_userId_categoryId_key" ON "public"."UserCategory"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "Location_userId_idx" ON "public"."Location"("userId");

-- CreateIndex
CREATE INDEX "Location_latitude_longitude_idx" ON "public"."Location"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Location_country_state_city_idx" ON "public"."Location"("country", "state", "city");

-- CreateIndex
CREATE INDEX "Location_zip_code_idx" ON "public"."Location"("zip_code");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "public"."Review"("userId");

-- CreateIndex
CREATE INDEX "Review_businessId_idx" ON "public"."Review"("businessId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "public"."Review"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewFeedback_reviewId_key" ON "public"."ReviewFeedback"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_reviewId_idx" ON "public"."ReviewFeedback"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_is_resolved_idx" ON "public"."ReviewFeedback"("is_resolved");

-- CreateIndex
CREATE INDEX "Like_reviewId_idx" ON "public"."Like"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_reviewId_key" ON "public"."Like"("userId", "reviewId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "public"."Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_parent_comment_id_idx" ON "public"."Comment"("parent_comment_id");

-- CreateIndex
CREATE INDEX "Comment_reviewId_createdAt_idx" ON "public"."Comment"("reviewId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Follow_followingUserId_idx" ON "public"."Follow"("followingUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingUserId_key" ON "public"."Follow"("followerId", "followingUserId");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_createdAt_idx" ON "public"."Message"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_is_read_idx" ON "public"."Message"("receiverId", "is_read");

-- CreateIndex
CREATE INDEX "BusinessVideo_businessId_createdAt_idx" ON "public"."BusinessVideo"("businessId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_is_read_createdAt_idx" ON "public"."Notification"("userId", "is_read", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_type_idx" ON "public"."Notification"("userId", "type");

-- CreateIndex
CREATE INDEX "SupportTicket_status_updatedAt_idx" ON "public"."SupportTicket"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "public"."SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_email_idx" ON "public"."SupportTicket"("email");

-- CreateIndex
CREATE INDEX "RecentSearch_userId_createdAt_idx" ON "public"."RecentSearch"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RecentSearch_userId_searchText_idx" ON "public"."RecentSearch"("userId", "searchText");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "public"."Setting"("key");

-- CreateIndex
CREATE INDEX "Plan_status_sort_order_idx" ON "public"."Plan"("status", "sort_order");

-- CreateIndex
CREATE INDEX "Subscription_businessId_status_idx" ON "public"."Subscription"("businessId", "status");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_ends_at_idx" ON "public"."Subscription"("ends_at");

-- CreateIndex
CREATE INDEX "QRCode_status_createdAt_idx" ON "public"."QRCode"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "QRCode_name_idx" ON "public"."QRCode"("name");

-- AddForeignKey
ALTER TABLE "public"."UserCategory" ADD CONSTRAINT "UserCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCategory" ADD CONSTRAINT "UserCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Location" ADD CONSTRAINT "Location_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Like" ADD CONSTRAINT "Like_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Follow" ADD CONSTRAINT "Follow_followingUserId_fkey" FOREIGN KEY ("followingUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BusinessVideo" ADD CONSTRAINT "BusinessVideo_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecentSearch" ADD CONSTRAINT "RecentSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
