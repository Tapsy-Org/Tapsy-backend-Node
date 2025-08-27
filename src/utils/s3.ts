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
      ACL: 'public-read', // Make the file publicly accessible
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
    console.log(`File uploaded successfully to S3 at ${key}`);
    return { key, publicUrl };
  } catch (error) {
    console.error('Failed to upload file to S3:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload file to S3: ${errorMessage}`);
  }
}
