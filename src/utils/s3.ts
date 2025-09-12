import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import type { Express } from 'express';
import path from 'path';

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Generate a pre-signed URL for an object in S3
 * @param key - The S3 object key
 * @param expiresIn - Expiration time in seconds (default: 7 days)
 */
export async function generateSignedUrl(
  key: string,
  expiresIn = 60 * 60 * 24 * 7,
): Promise<string> {
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error('Missing AWS_BUCKET_NAME in environment variables');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    return await awsGetSignedUrl(s3, command, { expiresIn });
  } catch (err) {
    console.error('❌ Failed to generate signed URL:', err);
    throw err;
  }
}

/**
 * Upload file to S3 and return public file URL
 * @param file - multer uploaded file
 * @param uploadType - "logo" | "video"
 * @param identifier - string used as folder name (UUID/username)
 */
export async function uploadToS3(
  file: Express.Multer.File,
  uploadType: 'logo' | 'video',
  identifier: string,
): Promise<string> {
  // create unique file name
  const ext = path.extname(file.originalname) || '';
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;

  // s3 key: logos/<id>/file or videos/<id>/file
  const key = `${uploadType}/${identifier}/${uniqueName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Body: file.buffer, // multer gives us the buffer
    ContentType: file.mimetype,
  });

  await s3.send(command);

  // return file URL
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Upload a file directly to S3
 * This function automatically creates the folder structure if it doesn't exist
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name of the file
 * @param fileType - MIME type of the file
 * @param uploadType - Type of upload (gallery or review)
 * @param userId - User ID for organizing files
 * @returns The S3 key and full URL of the uploaded file
 */
export async function uploadFileToS3(
  fileBuffer: Buffer,
  fileName: string,
  fileType: string,
  uploadType: 'gallery' | 'review',
  userId: string,
) {
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error('Missing AWS_BUCKET_NAME in environment variables');
  }

  const timestamp = Date.now();
  // S3 automatically creates folders when files are uploaded with folder structure in the key
  const key = `${uploadType}/${userId}/${timestamp}-${fileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
      Metadata: {
        uploadType,
        userId,
        originalFileName: fileName,
        uploadTimestamp: timestamp.toString(),
      },
    });

    await s3.send(command);

    // Generate the public URL
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { key, publicUrl };
  } catch (error) {
    console.error('Failed to upload file to S3:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload file to S3: ${errorMessage}`);
  }
}
