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
export async function uploadFileToS3(
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
