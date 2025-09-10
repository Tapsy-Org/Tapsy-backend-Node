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

-- CreateIndex
CREATE UNIQUE INDEX "ReviewFeedback_reviewId_key" ON "public"."ReviewFeedback"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_reviewId_idx" ON "public"."ReviewFeedback"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewFeedback_is_resolved_idx" ON "public"."ReviewFeedback"("is_resolved");

-- AddForeignKey
ALTER TABLE "public"."ReviewFeedback" ADD CONSTRAINT "ReviewFeedback_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
