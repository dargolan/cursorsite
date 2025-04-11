import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

console.log('S3 client initialized with region:', process.env.NEXT_PUBLIC_AWS_REGION);

export interface UploadParams {
  file: File;
  key: string;
  contentType?: string;
}

export async function uploadToS3({ file, key, contentType }: UploadParams) {
  try {
    // Validate inputs
    if (!process.env.NEXT_PUBLIC_AWS_BUCKET_NAME) {
      throw new Error('AWS bucket name is not configured');
    }

    const finalContentType = contentType || file.type;
    console.log('Uploading file:', {
      fileName: file.name,
      contentType: finalContentType,
      size: file.size,
      key
    });

    // Create the command for generating a presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: key,
      ContentType: finalContentType,
      ACL: 'public-read', // Make the uploaded file publicly readable
    });

    console.log('Generating presigned URL...');
    // Generate presigned URL with longer expiration
    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600,
    });
    console.log('Presigned URL generated');

    console.log('Uploading file using presigned URL...');
    // Upload the file using the presigned URL with explicit CORS headers
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': finalContentType,
        'x-amz-acl': 'public-read',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      let errorMessage = `Upload failed with status: ${response.status}`;
      try {
        const errorText = await response.text();
        errorMessage += ` - ${errorText}`;
      } catch (e) {
        console.warn('Could not read error response:', e);
      }
      throw new Error(errorMessage);
    }

    console.log('Upload successful');
    
    // Construct and return the public URL
    const publicUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
    
    // Verify the upload
    try {
      const verifyResponse = await fetch(publicUrl, { 
        method: 'HEAD',
        mode: 'cors'
      });
      if (!verifyResponse.ok) {
        console.warn('Upload succeeded but file verification failed. URL may not be immediately accessible.');
      }
    } catch (verifyError) {
      console.warn('Could not verify upload:', verifyError);
    }

    console.log('Public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

export async function getS3Url(key: string) {
  try {
    if (!process.env.NEXT_PUBLIC_AWS_BUCKET_NAME) {
      throw new Error('AWS bucket name is not configured');
    }

    console.log('Getting S3 URL for key:', key);
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 
    });
    console.log('Generated signed URL');
    return signedUrl;
  } catch (error) {
    console.error('Error getting S3 URL:', error);
    throw error;
  }
}

export function generateS3Key(fileName: string, prefix?: string) {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
  const key = prefix ? `${prefix}/${timestamp}-${sanitizedFileName}` : `${timestamp}-${sanitizedFileName}`;
  console.log('Generated S3 key:', key);
  return key;
} 