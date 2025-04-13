import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Track, Stem } from '../types';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

interface TrackUploadResult {
  trackUrl: string;
  imageUrl: string;
  stemUrls: Record<string, string>;
}

export interface TrackUploadParams {
  trackFile: File;
  imageFile: File;
  stemFiles: Record<string, File>; // key is stem name (e.g., "drums", "bass")
  trackTitle: string;
}

type ProgressCallback = (progress: number) => void;

/**
 * Generates a consistent S3 key for a track-related file
 */
function generateTrackS3Key(trackTitle: string, fileName: string, type: 'main' | 'cover' | 'stem'): string {
  const timestamp = Date.now();
  const sanitizedTrackTitle = trackTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
  
  switch (type) {
    case 'main':
      return `tracks/${sanitizedTrackTitle}/${timestamp}-main.${getFileExtension(fileName)}`;
    case 'cover':
      return `tracks/${sanitizedTrackTitle}/${timestamp}-cover.${getFileExtension(fileName)}`;
    case 'stem':
      return `tracks/${sanitizedTrackTitle}/stems/${timestamp}-${sanitizedFileName}`;
  }
}

/**
 * Gets the file extension from a filename
 */
function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Uploads a file to S3 and returns its URL
 */
async function uploadFileToS3(
  file: File,
  key: string,
  onProgress?: ProgressCallback
): Promise<string> {
  try {
    // Log environment variables (without sensitive data)
    console.log('Environment check:', {
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      hasAccessKey: !!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
    });

    // Create the command for generating a presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
      Key: key,
      ContentType: file.type,
    });

    console.log('Generating presigned URL for:', {
      bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      key,
      contentType: file.type
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600,
    });

    console.log('Presigned URL generated:', presignedUrl);

    // Upload the file using the presigned URL
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
      mode: 'cors',
    });

    // Log the complete response for debugging
    console.log('Upload response:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    // Calculate the public URL
    const region = process.env.NEXT_PUBLIC_AWS_REGION!;
    const bucket = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!;
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    // Add a small delay before verification
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the upload
    const verifyResponse = await fetch(publicUrl, { 
      method: 'HEAD',
      mode: 'cors'
    });

    if (!verifyResponse.ok) {
      console.error('Verification failed:', {
        status: verifyResponse.status,
        statusText: verifyResponse.statusText,
        headers: Object.fromEntries(verifyResponse.headers.entries())
      });
      throw new Error(`File verification failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }

    return publicUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Upload failed: Unknown error');
  }
}

/**
 * Uploads a track and its associated files to S3
 */
export async function uploadTrackToS3(
  params: TrackUploadParams,
  onProgress?: ProgressCallback
): Promise<TrackUploadResult> {
  try {
    const { trackFile, imageFile, stemFiles, trackTitle } = params;
    const totalFiles = 2 + Object.keys(stemFiles).length;
    let uploadedFiles = 0;

    // Upload track file
    const trackKey = generateTrackS3Key(trackTitle, trackFile.name, 'main');
    console.log('Uploading track:', { key: trackKey, type: trackFile.type });
    const trackUrl = await uploadFileToS3(trackFile, trackKey);
    uploadedFiles++;
    onProgress?.(Math.round((uploadedFiles / totalFiles) * 100));

    // Upload image file
    const imageKey = generateTrackS3Key(trackTitle, imageFile.name, 'cover');
    console.log('Uploading image:', { key: imageKey, type: imageFile.type });
    const imageUrl = await uploadFileToS3(imageFile, imageKey);
    uploadedFiles++;
    onProgress?.(Math.round((uploadedFiles / totalFiles) * 100));

    // Upload stem files
    const stemUrls: Record<string, string> = {};
    for (const [stemName, stemFile] of Object.entries(stemFiles)) {
      const stemKey = generateTrackS3Key(trackTitle, stemFile.name, 'stem');
      console.log('Uploading stem:', { name: stemName, key: stemKey, type: stemFile.type });
      const stemUrl = await uploadFileToS3(stemFile, stemKey);
      stemUrls[stemName] = stemUrl;
      uploadedFiles++;
      onProgress?.(Math.round((uploadedFiles / totalFiles) * 100));
    }

    return { trackUrl, imageUrl, stemUrls };
  } catch (error) {
    console.error('Error in uploadTrackToS3:', error);
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Upload failed: Unknown error');
  }
} 