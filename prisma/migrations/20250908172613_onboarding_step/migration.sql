-- CreateEnum
CREATE TYPE "public"."OnboardingStep" AS ENUM ('REGISTERED', 'CATEGORY', 'LOCATION', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "onboarding_step" "public"."OnboardingStep" DEFAULT 'REGISTERED';
