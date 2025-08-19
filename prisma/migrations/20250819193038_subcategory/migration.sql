/*
  Warnings:

  - You are about to drop the column `businessId` on the `BusinessUserSubCategory` table. All the data in the column will be lost.
  - You are about to drop the column `subCategoryId` on the `BusinessUserSubCategory` table. All the data in the column will be lost.
  - You are about to drop the column `subCategoryId` on the `IndividualUserSubCategory` table. All the data in the column will be lost.
  - You are about to drop the `SubCategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `BusinessUserSubCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `BusinessUserSubCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `IndividualUserSubCategory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."BusinessUserSubCategory" DROP CONSTRAINT "BusinessUserSubCategory_businessId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BusinessUserSubCategory" DROP CONSTRAINT "BusinessUserSubCategory_subCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."IndividualUserSubCategory" DROP CONSTRAINT "IndividualUserSubCategory_subCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubCategory" DROP CONSTRAINT "SubCategory_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."BusinessUserSubCategory" DROP COLUMN "businessId",
DROP COLUMN "subCategoryId",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."IndividualUserSubCategory" DROP COLUMN "subCategoryId",
ADD COLUMN     "name" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."SubCategory";

-- AddForeignKey
ALTER TABLE "public"."BusinessUserSubCategory" ADD CONSTRAINT "BusinessUserSubCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."BusinessUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
