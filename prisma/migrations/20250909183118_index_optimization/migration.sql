-- CreateIndex
CREATE INDEX "BusinessVideo_businessId_createdAt_idx" ON "public"."BusinessVideo"("businessId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "public"."Category"("name");

-- CreateIndex
CREATE INDEX "Category_audience_idx" ON "public"."Category"("audience");

-- CreateIndex
CREATE INDEX "Category_status_sort_order_idx" ON "public"."Category"("status", "sort_order");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "public"."Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_parent_comment_id_idx" ON "public"."Comment"("parent_comment_id");

-- CreateIndex
CREATE INDEX "Comment_reviewId_createdAt_idx" ON "public"."Comment"("reviewId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Follow_followingUserId_idx" ON "public"."Follow"("followingUserId");

-- CreateIndex
CREATE INDEX "Like_reviewId_idx" ON "public"."Like"("reviewId");

-- CreateIndex
CREATE INDEX "Location_userId_idx" ON "public"."Location"("userId");

-- CreateIndex
CREATE INDEX "Location_latitude_longitude_idx" ON "public"."Location"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Location_country_state_city_idx" ON "public"."Location"("country", "state", "city");

-- CreateIndex
CREATE INDEX "Location_zip_code_idx" ON "public"."Location"("zip_code");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_createdAt_idx" ON "public"."Message"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_is_read_idx" ON "public"."Message"("receiverId", "is_read");

-- CreateIndex
CREATE INDEX "Notification_userId_is_read_createdAt_idx" ON "public"."Notification"("userId", "is_read", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_type_idx" ON "public"."Notification"("userId", "type");

-- CreateIndex
CREATE INDEX "Plan_status_sort_order_idx" ON "public"."Plan"("status", "sort_order");

-- CreateIndex
CREATE INDEX "QRCode_status_createdAt_idx" ON "public"."QRCode"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "QRCode_name_idx" ON "public"."QRCode"("name");

-- CreateIndex
CREATE INDEX "RecentSearch_userId_createdAt_idx" ON "public"."RecentSearch"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RecentSearch_userId_searchText_idx" ON "public"."RecentSearch"("userId", "searchText");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "public"."Review"("userId");

-- CreateIndex
CREATE INDEX "Review_businessId_idx" ON "public"."Review"("businessId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "public"."Review"("status");

-- CreateIndex
CREATE INDEX "Subscription_businessId_status_idx" ON "public"."Subscription"("businessId", "status");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_ends_at_idx" ON "public"."Subscription"("ends_at");

-- CreateIndex
CREATE INDEX "SupportTicket_status_updatedAt_idx" ON "public"."SupportTicket"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "public"."SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_email_idx" ON "public"."SupportTicket"("email");

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
CREATE INDEX "UserCategory_userId_idx" ON "public"."UserCategory"("userId");
