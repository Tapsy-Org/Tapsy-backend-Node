/*
  Warnings:

  - A unique constraint covering the columns `[mobile_number]` on the table `BusinessUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `BusinessUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BusinessUser_mobile_number_key" ON "public"."BusinessUser"("mobile_number");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessUser_email_key" ON "public"."BusinessUser"("email");
