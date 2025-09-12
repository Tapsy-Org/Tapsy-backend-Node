import { PrismaClient, Status } from '@prisma/client';
import { Job, Worker } from 'bullmq';

import queueConfig from './config/queue';

const prisma = new PrismaClient();

const QUEUE_NAME = 'review-approval';

/**
 * The core processing function for each job.
 * This is where the business logic for approving a review resides.
 * @param job - The job object from BullMQ containing the reviewId.
 */
const processReviewApproval = async (job: Job) => {
  const { reviewId } = job.data;
  console.log(`[Worker] Processing job ${job.id} for review ${reviewId}...`);

  try {
    // Find the review in the database
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    // CRITICAL CHECK: Only update the review if it still exists and is PENDING.
    // This prevents overriding a manual approval/rejection by an admin.
    if (review && review.status === Status.PENDING) {
      await prisma.review.update({
        where: { id: reviewId },
        data: { status: Status.ACTIVE },
      });
      console.log(`[Worker] ✅ Approved review ${reviewId}.`);
    } else {
      console.log(
        `[Worker] - Skipping review ${reviewId}. Status is already '${review?.status}' or review not found.`,
      );
    }
  } catch (error) {
    console.error(`[Worker] ❌ Failed to process job ${job.id} for review ${reviewId}:`, error);
    // Throw the error again to ensure the job is marked as failed in BullMQ
    throw error;
  }
};

// --- Worker Initialization ---

// Get the shared Redis connection from your queue configuration
const connection = queueConfig.getConnection();

// Create the worker instance
const worker = new Worker(QUEUE_NAME, processReviewApproval, {
  connection,
  concurrency: 5, // Process up to 5 jobs at a time
});

// Add event listeners for logging and monitoring
worker.on('completed', (job: Job) => {
  console.log(`[Worker] Job ${job.id} has completed.`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
  if (job) {
    console.error(`[Worker] Job ${job.id} has failed with error: ${err.message}`);
  } else {
    console.error(`[Worker] An unknown job has failed with error: ${err.message}`);
  }
});

console.log(`🚀 Worker for '${QUEUE_NAME}' started successfully.`);
