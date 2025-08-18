/*
  Warnings:

  - A unique constraint covering the columns `[mobile_number]` on the table `IndividualUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "IndividualUser_mobile_number_key" ON "public"."IndividualUser"("mobile_number");
