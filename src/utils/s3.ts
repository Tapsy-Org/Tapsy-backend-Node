import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

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
 * Generate a pre-signed URL for uploading an object to S3
 * @param key - The S3 object key (e.g., "users/123/profile.png")
 * @param fileType - MIME type of the file (e.g., "image/png")
 * @param expiresIn - Expiration time in seconds (default: 5 minutes)
 */
export async function generateUploadUrl(
  fileName: string,
  fileType: string,
  uploadType: 'logo' | 'video',
  userId: string,
) {
  const key = `${uploadType}s/${userId}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await awsGetSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 min

  return { uploadUrl, key };
}
