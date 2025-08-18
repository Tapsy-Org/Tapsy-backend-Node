/*
  Warnings:

  - You are about to drop the `IndividualUserSubCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubCategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `firebase_token` to the `IndividualUser` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."IndividualUserSubCategory" DROP CONSTRAINT "IndividualUserSubCategory_individual_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."IndividualUserSubCategory" DROP CONSTRAINT "IndividualUserSubCategory_sub_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubCategory" DROP CONSTRAINT "SubCategory_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."IndividualUser" ADD COLUMN     "firebase_token" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."IndividualUserSubCategory";

-- DropTable
DROP TABLE "public"."SubCategory";

-- CreateTable
CREATE TABLE "public"."_IndividualUserCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IndividualUserCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_IndividualUserCategories_B_index" ON "public"."_IndividualUserCategories"("B");

-- AddForeignKey
ALTER TABLE "public"."_IndividualUserCategories" ADD CONSTRAINT "_IndividualUserCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_IndividualUserCategories" ADD CONSTRAINT "_IndividualUserCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."IndividualUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
