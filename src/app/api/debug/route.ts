import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getTracks } from '../../../services/strapi';

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    
    // Basic status check - good for verifying the API is working
    if (action === 'status') {
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    }
    
    // Check if track ID exists in S3
    if (action === 'check-track') {
      const trackId = searchParams.get('trackId');
      if (!trackId) {
        return NextResponse.json({ error: 'Missing trackId parameter' }, { status: 400 });
      }
      
      const result = await checkTrackInS3(trackId);
      return NextResponse.json(result);
    }
    
    // List all tracks in S3
    if (action === 'list-s3-tracks') {
      const result = await listTracksInS3();
      return NextResponse.json(result);
    }
    
    // Compare Strapi tracks with S3 tracks
    if (action === 'compare-tracks') {
      const result = await compareTracksWithS3();
      return NextResponse.json(result);
    }
    
    // If action is not recognized
    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('[DEBUG API] Error:', error);
    return NextResponse.json({
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * Check if a track ID exists in S3 and what files are available
 */
async function checkTrackInS3(trackId: string) {
  // Check both numeric ID format and track titles
  const isNumericId = /^\d+$/.test(trackId);
  
  // Direct path check (numeric ID)
  const numericPath = `tracks/${trackId}/`;
  let numericPathExists = false;
  
  // List objects with this path
  try {
    const numericCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: numericPath,
      MaxKeys: 10
    });
    
    const numericResult = await s3Client.send(numericCommand);
    numericPathExists = !!(numericResult.Contents && numericResult.Contents.length > 0);
  } catch (error) {
    console.error(`[DEBUG API] Error checking numeric path ${numericPath}:`, error);
  }
  
  // Get a list of all UUID folders to check
  const uuidFolders = await getUuidFolders();
  
  // Try to find a corresponding UUID folder (if this is a numeric ID)
  // Note: This is a simplified implementation; in production, you'd use a database mapping
  let matchingUuidFolder = null;
  let matchingFiles = [];
  
  // List all tracks/ folders
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'tracks/',
    Delimiter: '/'
  });
  
  const result = await s3Client.send(listCommand);
  const allFolders = result.CommonPrefixes?.map(prefix => prefix.Prefix || '') || [];
  
  // Look for an exact folder match (title-based)
  let titleBasedFolder = null;
  for (const folder of allFolders) {
    const folderName = folder.replace('tracks/', '').replace('/', '');
    if (folderName.toLowerCase() === trackId.toLowerCase()) {
      titleBasedFolder = folder;
      break;
    }
  }
  
  // Check contents of title-based folder if found
  const titleBasedFiles: Array<{key: string | undefined, size: number | undefined, lastModified: Date | undefined}> = [];
  if (titleBasedFolder) {
    try {
      const folderCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: titleBasedFolder,
        MaxKeys: 20
      });
      
      const folderResult = await s3Client.send(folderCommand);
      if (folderResult.Contents) {
        folderResult.Contents.forEach(item => {
          titleBasedFiles.push({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified
          });
        });
      }
    } catch (error) {
      console.error(`[DEBUG API] Error checking title folder ${titleBasedFolder}:`, error);
    }
  }
  
  return {
    trackId,
    isNumericId,
    numericPathExists,
    numericPath,
    uuidFolders: uuidFolders.length,
    titleBasedFolder,
    titleBasedFiles,
    // Include a list of test URLs that could be tried
    testUrls: {
      directNumeric: `/api/direct-s3/tracks/${trackId}/image`,
      titleBased: titleBasedFolder ? 
        `/api/direct-s3/${titleBasedFolder}image` : null
    }
  };
}

/**
 * Get a list of UUID folders in S3
 */
async function getUuidFolders() {
  // List all folders in tracks/
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'tracks/',
    Delimiter: '/'
  });
  
  const result = await s3Client.send(listCommand);
  
  // Filter for UUID pattern
  const uuidFolders = result.CommonPrefixes?.filter(prefix => {
    const folderName = prefix.Prefix?.replace('tracks/', '').replace('/', '') || '';
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(folderName);
  }).map(prefix => prefix.Prefix || '') || [];
  
  return uuidFolders;
}

/**
 * List all tracks in S3
 */
async function listTracksInS3() {
  // List all folders in tracks/
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'tracks/',
    Delimiter: '/'
  });
  
  const result = await s3Client.send(listCommand);
  const folders = result.CommonPrefixes?.map(prefix => prefix.Prefix || '') || [];
  
  // Get details for each folder
  const trackDetails = [];
  for (const folder of folders) {
    try {
      // List contents of this folder
      const folderCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: folder,
        MaxKeys: 10
      });
      
      const folderResult = await s3Client.send(folderCommand);
      const files = folderResult.Contents?.map(item => item.Key?.split('/').pop() || '') || [];
      
      // Get folder name without the tracks/ prefix and trailing slash
      const folderName = folder.replace('tracks/', '').replace('/', '');
      
      trackDetails.push({
        folder,
        folderName,
        isUuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(folderName),
        files,
        hasCover: files.some(file => ['cover.jpg', 'cover.png', 'image.jpg', 'cover.webp', 'artwork.jpg'].includes(file)),
        hasAudio: files.some(file => ['main.mp3', 'main.wav', 'track.mp3', 'audio.mp3'].includes(file))
      });
    } catch (error) {
      console.error(`[DEBUG API] Error processing folder ${folder}:`, error);
    }
  }
  
  return {
    bucketName,
    folderCount: folders.length,
    tracks: trackDetails
  };
}

/**
 * Compare Strapi tracks with S3 tracks
 */
async function compareTracksWithS3() {
  // Get all tracks from Strapi
  const strapiTracks = await getTracks();
  
  // Get all tracks from S3
  const s3Result = await listTracksInS3();
  const s3Tracks = s3Result.tracks;
  
  // Map Strapi track IDs to their details
  const strapiTracksMap = strapiTracks.reduce((map, track) => {
    map[track.id] = {
      id: track.id,
      title: track.title,
      s3Path: track.s3Path || ''
    };
    return map;
  }, {} as Record<string, { id: string, title: string, s3Path: string }>);
  
  // Check for each Strapi track if it exists in S3
  const comparisonResults = strapiTracks.map(track => {
    // Check if track has matching folder in S3
    const matchingS3Track = s3Tracks.find(s3Track => {
      // Check if UUID folder matches s3Path
      if (track.s3Path === `tracks/${s3Track.folderName}`) {
        return true;
      }
      
      // Check if name-based folder matches title
      const sanitizedTitle = track.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (sanitizedTitle === s3Track.folderName.toLowerCase()) {
        return true;
      }
      
      return false;
    });
    
    return {
      strapiId: track.id,
      title: track.title,
      s3Path: track.s3Path,
      matchFound: !!matchingS3Track,
      s3Folder: matchingS3Track?.folder || null,
      s3Files: matchingS3Track?.files || [],
      hasCover: matchingS3Track?.hasCover || false,
      hasAudio: matchingS3Track?.hasAudio || false
    };
  });
  
  return {
    strapiTrackCount: strapiTracks.length,
    s3TrackCount: s3Tracks.length,
    comparisonResults
  };
} 