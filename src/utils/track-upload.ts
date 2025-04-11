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
 * Uploads a single file to S3 and returns its URL
 */
async function uploadFileToS3(file: File, key: string): Promise<string> {
  try {
    // Create the command for generating a presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
      Key: key,
      ContentType: file.type,
    });

    // Generate presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Upload the file using the presigned URL
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    // Return the public URL of the uploaded file
    return `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

/**
 * Uploads a track and all its associated files to S3 in an organized structure
 */
export async function uploadTrackToS3(params: TrackUploadParams): Promise<TrackUploadResult> {
  const { trackFile, imageFile, stemFiles, trackTitle } = params;

  try {
    // Upload main track file
    const trackKey = generateTrackS3Key(trackTitle, trackFile.name, 'main');
    const trackUrl = await uploadFileToS3(trackFile, trackKey);

    // Upload cover image
    const imageKey = generateTrackS3Key(trackTitle, imageFile.name, 'cover');
    const imageUrl = await uploadFileToS3(imageFile, imageKey);

    // Upload all stem files
    const stemUrls: Record<string, string> = {};
    for (const [stemName, stemFile] of Object.entries(stemFiles)) {
      const stemKey = generateTrackS3Key(trackTitle, `${stemName}.${getFileExtension(stemFile.name)}`, 'stem');
      stemUrls[stemName] = await uploadFileToS3(stemFile, stemKey);
    }

    return {
      trackUrl,
      imageUrl,
      stemUrls,
    };
  } catch (error) {
    console.error('Error uploading track files:', error);
    throw error;
  }
} 