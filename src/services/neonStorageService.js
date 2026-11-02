/**
 * HisabKitab 360 - Neon Cloud Object Storage (S3 Compatible)
 * ---------------------------------------------------------
 * Handles product images, digital invoice PDFs, and backup files.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const getS3Config = () => {
  return {
    region: import.meta.env.VITE_AWS_REGION || import.meta.env.AWS_REGION || 'ap-southeast-1',
    endpoint: import.meta.env.VITE_AWS_ENDPOINT_URL_S3 || import.meta.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || import.meta.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || import.meta.env.AWS_SECRET_ACCESS_KEY || ''
    }
  };
};

let s3ClientInstance = null;
export const getNeonS3Client = () => {
  if (!s3ClientInstance) {
    const config = getS3Config();
    if (config.endpoint && config.credentials.accessKeyId) {
      s3ClientInstance = new S3Client(config);
    }
  }
  return s3ClientInstance;
};

/**
 * Upload Image or File to Neon Object Storage
 */
export const uploadToNeonStorage = async (fileKey, fileBody, contentType = 'application/octet-stream') => {
  try {
    const s3 = getNeonS3Client();
    if (!s3) throw new Error('Neon S3 Storage credentials not configured');

    const bucketName = 'assets'; // defined in neon.ts
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBody,
      ContentType: contentType
    });

    await s3.send(command);
    return {
      success: true,
      key: fileKey,
      url: `${import.meta.env.VITE_AWS_ENDPOINT_URL_S3 || ''}/${bucketName}/${fileKey}`
    };
  } catch (err) {
    console.error('Neon Storage Upload Error:', err);
    return { success: false, error: err.message };
  }
};
