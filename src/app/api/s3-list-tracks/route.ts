import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Bucket name
const bucketName = process.env.AWS_BUCKET_NAME || 'wave-cave-audio';

export async function GET() {
  try {
    console.log('[S3-LIST-TRACKS] Listing tracks in bucket:', bucketName);
    
    // List all objects with tracks/ prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'tracks/',
      Delimiter: '/'  // Use delimiter to get just the top-level folders
    });
    
    const result = await s3Client.send(listCommand);
    
    // Extract track folders (common prefixes)
    const trackFolders = result.CommonPrefixes?.map(prefix => ({
      path: prefix.Prefix?.replace(/\/$/, '') || '',  // Remove trailing slash
      name: extractTrackNameFromPath(prefix.Prefix || '')
    })) || [];
    
    // Also check for direct files in the tracks/ directory
    const trackFiles = result.Contents?.filter(item => 
      !item.Key?.endsWith('/') // Not a directory marker
    ).map(item => ({
      path: item.Key?.replace(/\/(main|cover)\.(mp3|jpg)$/, '') || '',
      name: extractTrackNameFromPath(item.Key || ''),
      type: item.Key?.endsWith('.mp3') ? 'audio' : 'image',
      lastModified: item.LastModified
    })) || [];
    
    console.log(`[S3-LIST-TRACKS] Found ${trackFolders.length} track folders and ${trackFiles.length} track files`);
    
    // Return list of track folders and files
    return NextResponse.json({
      success: true,
      tracks: [...trackFolders, ...trackFiles],
      rawPrefixes: result.CommonPrefixes,
      rawContents: result.Contents
    });
  } catch (error: any) {
    console.error('[S3-LIST-TRACKS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        name: error.name
      }
    }, { status: 500 });
  }
}

/**
 * Extract a human-readable track name from an S3 path
 */
function extractTrackNameFromPath(path: string): string {
  // Remove the tracks/ prefix
  const withoutPrefix = path.replace(/^tracks\//, '');
  
  // Extract the folder name (everything before the first slash or file extension)
  const folderName = withoutPrefix.split('/')[0].split('.')[0];
  
  // Convert to title case with spaces
  return folderName
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 