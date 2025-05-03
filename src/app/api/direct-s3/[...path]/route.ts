import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getUuidForId } from '../../server-utils/id-mapping-cache';

// Check if AWS credentials are configured
const awsCredentialsConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

// Create S3 client only if we have credentials
const s3Client = awsCredentialsConfigured 
  ? new S3Client({
      region: process.env.AWS_REGION || 'eu-north-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    })
  : null;

// Log credential status on startup
console.log(`[DIRECT-S3] AWS credentials ${awsCredentialsConfigured ? 'configured' : 'NOT configured'}`);

// Bucket name
const bucketName = process.env.AWS_BUCKET_NAME || 'wave-cave-audio';

// Flag to indicate if we have valid AWS credentials
const hasValidAwsCredentials = awsCredentialsConfigured;

// Strapi API URL and token
const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
const STRAPI_API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

/**
 * Query Strapi directly for a track's UUID by its ID
 * This is more reliable than hardcoded mappings
 */
async function getStrapiTrackUuid(trackId: string): Promise<string | null> {
  try {
    console.log(`[DIRECT-S3] Querying Strapi for UUID of track ${trackId}`);
    
    // Construct headers with authorization if token is available
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }
    
    // Query Strapi for this track
    const response = await fetch(`${STRAPI_API_URL}/tracks/${trackId}?populate=*`, {
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`[DIRECT-S3] Strapi query failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (!data?.data) {
      console.error('[DIRECT-S3] No data returned from Strapi');
      return null;
    }
    
    // Extract UUID from various possible fields
    const trackData = data.data.attributes || {};
    const uuid = trackData.uuid || 
                 trackData.s3_uuid || 
                 trackData.s3Id || 
                 trackData.s3_id || 
                 trackData.s3TrackId || 
                 trackData.s3_track_id;
    
    if (uuid) {
      console.log(`[DIRECT-S3] Found UUID ${uuid} for track ${trackId} in Strapi`);
      return uuid;
    }
    
    console.log(`[DIRECT-S3] No UUID found for track ${trackId} in Strapi`);
    return null;
  } catch (error) {
    console.error(`[DIRECT-S3] Error querying Strapi for track ${trackId}:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Ensure we can handle both direct and Next.js Image formatted requests
    let path = params.path?.join('/') || '';
    
    // If this is a Next.js Image URL request with encoded URL in query string, extract it
    const url = request.nextUrl.searchParams.get('url');
    if (url && url.includes('/api/direct-s3/')) {
      // Extract the path from the URL parameter
      const matches = url.match(/\/api\/direct-s3\/(.+)/);
      if (matches && matches[1]) {
        path = decodeURIComponent(matches[1]);
        console.log('[DIRECT-S3] Extracted path from Next.js Image URL:', path);
      }
    }
    
    console.log('[DIRECT-S3] Requested path:', path);

    // Add detailed request context for debugging
    console.log('[DIRECT-S3] Full request context:', {
      url: request.url,
      path: path,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      queryParams: Object.fromEntries(request.nextUrl.searchParams.entries())
    });
    
    // Special case handling for "/??/cover.jpg" or other invalid paths
    if (path.includes('??') || path.includes('undefined') || path.includes('null')) {
      console.log('[DIRECT-S3] Detected invalid track ID in path:', path);
      return new NextResponse(JSON.stringify({ 
        error: 'Invalid track ID in path',
        path
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // If only file name is requested (e.g., "cover.jpg"), return an error
    if (!path.includes('/') && (path === 'cover.jpg' || path === 'main.mp3')) {
      console.log('[DIRECT-S3] Missing track ID in path - requires format tracks/[id]/[file]:', path);
      return new NextResponse(JSON.stringify({ 
        error: 'Missing track ID in path - requires format tracks/[id]/[file]',
        path
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Handle special dynamic paths that don't hardcode filenames
    const dynamicPathMatch = path.match(/tracks\/(.+?)\/(audio|image)/i);
    if (dynamicPathMatch) {
      const trackIdentifier = dynamicPathMatch[1]; // Could be UUID or numeric ID
      const assetType = dynamicPathMatch[2].toLowerCase(); // 'audio' or 'image'
      
      console.log(`[DIRECT-S3] Detected dynamic path request for ${assetType} of track ${trackIdentifier}`);
      
      // Determine if trackIdentifier is numeric (Strapi ID) or UUID
      const isNumeric = /^\d+$/.test(trackIdentifier);
      let uuid = isNumeric ? null : trackIdentifier;
      
      // If numeric ID, resolve to UUID
      if (isNumeric) {
        // First try Strapi
        uuid = await getStrapiTrackUuid(trackIdentifier);
        
        // Then try mapping service
        if (!uuid) {
          uuid = await getUuidForId(trackIdentifier);
        }
        
        if (!uuid) {
          console.log(`[DIRECT-S3] Could not resolve UUID for ID ${trackIdentifier}`);
          return new NextResponse(JSON.stringify({
            error: `Could not resolve UUID for ID ${trackIdentifier}`,
            path
          }), { status: 404 });
        }
      }
      
      // Now construct potential filenames based on asset type
      let filesToTry: string[] = [];
      if (assetType === 'audio') {
        filesToTry = ['main.mp3', 'main.wav', 'track.mp3', 'audio.mp3'];
      } else if (assetType === 'image') {
        filesToTry = ['cover.jpg', 'cover.png', 'image.jpg', 'cover.webp', 'artwork.jpg'];
      }
      
      // Try each potential filename
      for (const fileName of filesToTry) {
        try {
          const s3Key = `tracks/${uuid}/${fileName}`;
          console.log(`[DIRECT-S3] Trying to access ${s3Key}`);
          
          // Check if this file exists
          const s3Response = await getS3Object(s3Key);
          if (s3Response) {
            console.log(`[DIRECT-S3] Found ${assetType} at ${s3Key}`);
            return createResponse(s3Response);
          }
        } catch (fileError) {
          console.log(`[DIRECT-S3] File ${fileName} not found for track ${uuid}`);
          // Continue to the next filename
        }
      }
      
      // If we get here, none of the files were found
      console.error(`[DIRECT-S3] No ${assetType} files found for track ${uuid}`);
      return new NextResponse(JSON.stringify({
        error: `No ${assetType} files found for track ${uuid}`,
        path
      }), { status: 404 });
    }
    
    // Handle numeric track IDs that need translation to S3 UUIDs
    const idMatch = path.match(/tracks\/(\d+)\/(.+)/);
    if (idMatch) {
      const numericId = idMatch[1];
      const assetFile = idMatch[2];
      
      console.log(`[DIRECT-S3] Detected numeric ID ${numericId} in path, looking up UUID...`);
      
      try {
        // Try multiple approaches to find the UUID, in order of reliability
        let uuid: string | null = null;
        
        // 1. First try to get UUID directly from Strapi
        uuid = await getStrapiTrackUuid(numericId);
        
        // 2. If not found in Strapi, try the mapping service
        if (!uuid) {
          console.log(`[DIRECT-S3] No UUID found in Strapi for ID ${numericId}, trying mapping service...`);
          uuid = await getUuidForId(numericId);
        }
        
        if (uuid) {
          // Use the UUID to construct the S3 path
          const s3Path = `tracks/${uuid}/${assetFile}`;
          console.log(`[DIRECT-S3] Mapped numeric ID ${numericId} to UUID path: ${s3Path}`);
          
          try {
            const s3Response = await getS3Object(s3Path);
            return createResponse(s3Response);
          } catch (error: any) {
            console.error(`[DIRECT-S3] Error accessing S3 with resolved UUID path ${s3Path}:`, error);
            // Continue to other resolution methods below
          }
        } else {
          console.log(`[DIRECT-S3] No UUID mapping found for numeric ID ${numericId}`);
        }
      } catch (error: any) {
        console.error(`[DIRECT-S3] Error during UUID mapping for ID ${numericId}:`, error);
        // Continue to try direct access
      }
    }
    
    // If this appears to be a track-name based URL, find the actual file path
    if (path.startsWith('tracks/') && (
        path.includes('/main.mp3') || 
        path.includes('/cover.jpg') ||
        path.includes('/audio') ||
        path.includes('/image')
      )) {
      const resolvedKey = await findTrackFilePath(path);
      if (resolvedKey) {
        console.log(`[DIRECT-S3] Resolved path "${path}" to "${resolvedKey}"`);
        const s3Response = await getS3Object(resolvedKey);
        return createResponse(s3Response);
      }
    }
    
    // Regular direct path access
    console.log(`[DIRECT-S3] Attempting direct S3 access for path: ${path}`);
    const s3Response = await getS3Object(path);
    return createResponse(s3Response);
  } catch (error: any) {
    console.error('[DIRECT-S3] Error:', error);
    
    // Check if this is a S3 NoSuchKey error for a numeric ID
    if (error.Code === 'NoSuchKey' && error.Key) {
      const idMatch = error.Key.match(/tracks\/(\d+)\/(.+)/);
      if (idMatch) {
        const numericId = idMatch[1];
        const assetFile = idMatch[2];
        
        // Try to get the UUID from Strapi as a recovery attempt
        try {
          console.log(`[DIRECT-S3] NoSuchKey error recovery: trying Strapi lookup for ID ${numericId}`);
          let uuid = await getStrapiTrackUuid(numericId);
          
          if (uuid) {
            console.log(`[DIRECT-S3] Recovery found UUID ${uuid} for ID ${numericId}`);
            const recoveryPath = `tracks/${uuid}/${assetFile}`;
            const s3Response = await getS3Object(recoveryPath);
            return createResponse(s3Response);
          }
        } catch (recoveryError) {
          console.error('[DIRECT-S3] Recovery attempt failed:', recoveryError);
        }
      }
    }
    
    // Return detailed error information
    return NextResponse.json({
      error: error.message,
      code: error.code,
      name: error.name,
      path: params.path?.join('/') || '',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: error.code === 'NoSuchKey' ? 404 : 500 });
  }
}

/**
 * Get an object from S3
 */
async function getS3Object(key: string) {
  // Check if AWS credentials are configured
  if (!hasValidAwsCredentials) {
    console.warn('[DIRECT-S3] AWS credentials not configured! Using development fallback.');
    console.warn('⚠️ In production, this would fail. Files should always be fetched from S3.');
    
    // Development-only fallback for missing AWS credentials
    if (process.env.NODE_ENV === 'development') {
      return createMockS3Response(key);
    } else {
      // In production, we should not use the fallback
      throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
    }
  }
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  try {
    console.log(`[DIRECT-S3] Fetching object from S3: ${key}`);
    return await s3Client.send(command);
  } catch (error) {
    console.error(`[DIRECT-S3] Error fetching from S3:`, error);
    
    // Development-only fallback for S3 access errors
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ S3 fetch failed but returning mock data for development purposes.');
      return createMockS3Response(key);
    }
    
    throw error;
  }
}

/**
 * Create a mock S3 response with placeholder data for development
 */
async function createMockS3Response(key: string) {
  console.log(`[DIRECT-S3] Creating mock S3 response for: ${key}`);
  
  // Try to load from local mock files first
  try {
    const fs = require('fs');
    const path = require('path');
    const mockFilePath = path.join(process.cwd(), 's3-mock-data', key);
    
    // Check if the mock file exists
    if (fs.existsSync(mockFilePath)) {
      console.log(`[DIRECT-S3] Found local mock file at ${mockFilePath}`);
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream';
      if (mockFilePath.endsWith('.jpg') || mockFilePath.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (mockFilePath.endsWith('.png')) contentType = 'image/png';
      else if (mockFilePath.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (mockFilePath.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (mockFilePath.endsWith('.wav')) contentType = 'audio/wav';
      
      // Read the file
      const fileData = fs.readFileSync(mockFilePath);
      const mockData = new Uint8Array(fileData);
      
      const mockStream = {
        transformToByteArray: async () => mockData,
        Body: {
          transformToByteArray: async () => mockData
        },
        ContentType: contentType,
        ContentLength: mockData.length
      };
      
      return mockStream;
    }
  } catch (error) {
    console.log(`[DIRECT-S3] No local mock file available, generating placeholder`);
  }
  
  // Determine content type based on file extension
  let contentType = 'application/octet-stream';
  let mockData: Uint8Array;
  
  if (key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.png') || key.includes('/image') || key.includes('/cover')) {
    // Extract the track name from the key for better placeholders
    const pathParts = key.split('/');
    let trackId = pathParts.length > 1 ? pathParts[1] : 'Unknown';
    let trackName = trackId;
    
    // Try to make trackName more readable if it's a UUID
    if (trackId.includes('-') && trackId.length > 30) {
      // This is probably a UUID, use a shorter name
      trackName = 'Track ' + trackId.substring(0, 8);
    } else {
      // Try to convert dashes to spaces for readability
      trackName = trackId.replace(/-/g, ' ').replace(/_/g, ' ');
      
      // Capitalize words
      trackName = trackName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    // For cover images, return an SVG placeholder with wave animation
    contentType = 'image/svg+xml';
    
    // Create an SVG placeholder with the track name and wave animation
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#252525" />
          <stop offset="100%" stop-color="#101010" />
        </linearGradient>
        <style>
          @keyframes wave {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .wave {
            animation: wave 8s infinite linear;
          }
        </style>
      </defs>
      <rect width="400" height="400" fill="#121212"/>
      <rect width="400" height="400" fill="url(#gradient)"/>
      
      <!-- Wave Cave Logo -->
      <g transform="translate(200, 120) scale(0.8)">
        <path d="M0,-50 C60,-50 60,50 0,50 C-60,50 -60,-50 0,-50 Z" fill="none" stroke="#1DF7CE" stroke-width="3"/>
        <path class="wave" d="M-40,0 Q-30,-15 -20,0 Q-10,15 0,0 Q10,-15 20,0 Q30,15 40,0" fill="none" stroke="#1DF7CE" stroke-width="2"/>
      </g>
      
      <!-- Track Info -->
      <text x="50%" y="58%" font-family="Arial, sans-serif" font-size="24" fill="#1DF7CE" text-anchor="middle" font-weight="bold">${trackName}</text>
      <text x="50%" y="68%" font-family="Arial, sans-serif" font-size="14" fill="#999999" text-anchor="middle">ID: ${trackId}</text>
      <text x="50%" y="75%" font-family="Arial, sans-serif" font-size="14" fill="#999999" text-anchor="middle">Development Placeholder</text>
      
      <!-- Play Button -->
      <circle cx="200" cy="260" r="30" fill="none" stroke="#1DF7CE" stroke-width="2"/>
      <path d="M190,245 L190,275 L220,260 Z" fill="#1DF7CE"/>
    </svg>`;
    
    mockData = new TextEncoder().encode(svgContent);
  } else if (key.endsWith('.mp3') || key.endsWith('.wav') || key.includes('/audio')) {
    // For audio files, return a tiny silent MP3
    contentType = 'audio/mpeg';
    // A minimal silent MP3 file (2 seconds of silence)
    mockData = new Uint8Array([
      0xFF, 0xE3, 0x18, 0xC4, 0x00, 0x00, 0x00, 0x03, 0x48, 0x00, 0x00, 0x00, 
      0x00, 0x4C, 0x41, 0x4D, 0x45, 0x33, 0x2E, 0x39, 0x39, 0x72, 0xFF, 0xE3, 
      0x18, 0xC4, 0x00, 0x00, 0x00, 0x03, 0x48, 0x00, 0x00, 0x00, 0x00, 0x4C, 
      0x41, 0x4D, 0x45, 0x33, 0x2E, 0x39, 0x39, 0x72, 0xFF, 0xE3, 0x18, 0xC4, 
      0x00, 0x00, 0x00, 0x03, 0x48, 0x00, 0x00, 0x00, 0x00, 0x4C, 0x41, 0x4D, 
      0x45, 0x33, 0x2E, 0x39, 0x39, 0x72
    ]);
  } else {
    // For other file types, return empty data
    mockData = new Uint8Array(10);
  }
  
  const mockStream = {
    transformToByteArray: async () => mockData,
    Body: {
      transformToByteArray: async () => mockData
    },
    ContentType: contentType,
    ContentLength: mockData.length
  };
  
  return mockStream;
}

/**
 * Create HTTP response from S3 response
 */
async function createResponse(s3Response: any) {
  // Convert the readable stream to an array buffer
  const contentType = s3Response.ContentType || 'application/octet-stream';
  const arrayBuffer = await s3Response.Body.transformToByteArray();
  
  console.log(`[DIRECT-S3] Successfully retrieved object, size: ${arrayBuffer.length} bytes, type: ${contentType}`);
  
  // Return the response with appropriate headers
  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': arrayBuffer.length.toString(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'public, max-age=3600',
    }
  });
}

/**
 * Find the actual S3 file path when using track title-based URLs
 */
async function findTrackFilePath(requestedPath: string): Promise<string | null> {
  try {
    // Extract the track name part from the path
    // Format: tracks/track-name/main.mp3 or tracks/track-name/cover.jpg or tracks/track-name/image
    const parts = requestedPath.split('/');
    if (parts.length < 3) return null;
    
    const trackId = parts[1]; // Could be a UUID, numeric ID, or track name
    const assetType = parts[2].split('.')[0]; // main, cover, audio, image, etc.
    const extension = parts[2].includes('.') ? parts[2].split('.')[1] : ''; // mp3, jpg, etc.
    
    console.log(`[DIRECT-S3] Finding file for track ID/name: "${trackId}", asset: "${assetType}", extension: "${extension}"`);
    
    // Determine what asset type we're looking for
    let filesToTry: string[] = [];
    if (assetType === 'audio' || assetType === 'main') {
      filesToTry = ['main.mp3', 'main.wav', 'track.mp3', 'audio.mp3'];
    } else if (assetType === 'image' || assetType === 'cover') {
      filesToTry = ['cover.jpg', 'cover.png', 'image.jpg', 'cover.webp', 'artwork.jpg'];
    } else if (extension) {
      // If we have a specific file with extension, just use that
      filesToTry = [`${assetType}.${extension}`];
    }
    
    // In development mode with no AWS credentials, use mock response
    if (process.env.NODE_ENV === 'development' && !hasValidAwsCredentials) {
      console.log(`[DIRECT-S3] Using mock data for path: ${requestedPath} (missing AWS credentials)`);
      // Return the path as is - it will be handled by the mock response
      return `tracks/${trackId}/${filesToTry[0]}`;
    }
    
    // Check if this is likely a numeric Strapi ID - need to translate to UUID
    const isNumericId = /^\d+$/.test(trackId);
    let uuid: string | null = null;
    
    if (isNumericId) {
      console.log(`[DIRECT-S3] Detected numeric Strapi ID: ${trackId} - attempting to find corresponding UUID`);
      
      // Try multiple approaches to find the UUID
      uuid = await getUuidForId(trackId);
      
      if (uuid) {
        // Try each potential filename for this UUID
        for (const fileName of filesToTry) {
          const mappedPath = `tracks/${uuid}/${fileName}`;
          console.log(`[DIRECT-S3] Trying mapping for ID ${trackId} -> ${mappedPath}`);
          
          try {
            // Try to get the object with the mapped UUID
            if (hasValidAwsCredentials) {
              const testCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: mappedPath,
              });
              await s3Client.send(testCommand);
            } else if (process.env.NODE_ENV === 'development') {
              // In development, just assume it exists
              console.log(`[DIRECT-S3] Development mode: assuming ${mappedPath} exists`);
              return mappedPath;
            } else {
              throw new Error('AWS credentials not configured');
            }
            
            // If we get here, the file exists with the mapped UUID
            console.log(`[DIRECT-S3] Resolved numeric ID ${trackId} to UUID path: ${mappedPath}`);
            return mappedPath;
          } catch (error: any) {
            if (error.code !== 'NoSuchKey' && !error.message?.includes('AWS credentials')) {
              throw error; // Re-throw unexpected errors
            }
            // If not found with this filename, continue to the next one
            console.log(`[DIRECT-S3] File not found at mapped path ${mappedPath}, trying next filename`);
          }
        }
        
        // If we get here, none of the filenames were found
        console.log(`[DIRECT-S3] No matching files found for UUID ${uuid}, trying direct methods`);
      } else {
        console.log(`[DIRECT-S3] No mapping found for numeric ID ${trackId}`);
      }
    }
    
    // First try direct access with each potential filename
    for (const fileName of filesToTry) {
      const directPath = `tracks/${trackId}/${fileName}`;
      
      try {
        // Try to get the object directly
        if (hasValidAwsCredentials) {
          const testCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: directPath,
          });
          await s3Client.send(testCommand);
        } else if (process.env.NODE_ENV === 'development') {
          // In development, just assume it exists
          console.log(`[DIRECT-S3] Development mode: assuming ${directPath} exists`);
          return directPath;
        } else {
          throw new Error('AWS credentials not configured');
        }
        
        // If we get here, the file exists with the direct path
        console.log(`[DIRECT-S3] Found file directly at ${directPath}`);
        return directPath;
      } catch (error: any) {
        if (error.code !== 'NoSuchKey' && !error.message?.includes('AWS credentials')) {
          throw error; // Re-throw unexpected errors
        }
        // Expected - file doesn't exist directly with this filename, try next one
      }
    }
    
    // If we get here, no direct files were found
    if (isNumericId) {
      console.log(`[DIRECT-S3] Numeric ID ${trackId} doesn't map directly to an S3 path, attempting to find matching folder`);
    }
    
    // Skip S3 listing in development mode without credentials
    if (!hasValidAwsCredentials) {
      if (process.env.NODE_ENV === 'development') {
        // For development, return a mock path based on trackId
        const mockPath = `tracks/${trackId}/${filesToTry[0]}`;
        console.log(`[DIRECT-S3] Development mode: returning mock path ${mockPath}`);
        return mockPath;
      } else {
        throw new Error('AWS credentials not configured');
      }
    }
    
    // List all folders in the tracks/ directory
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'tracks/',
      Delimiter: '/'
    });
    
    const result = await s3Client.send(listCommand);
    console.log(`[DIRECT-S3] Found ${result.CommonPrefixes?.length || 0} folders in tracks/ directory`);
    
    // Check each folder to find one that might match our track name
    const folderMatch = result.CommonPrefixes?.find(prefix => {
      const folderName = prefix.Prefix?.replace('tracks/', '').replace('/', '') || '';
      
      // If we're dealing with a numeric ID, try to find a UUID or other match
      if (isNumericId) {
        // This is handled by the dynamic mapping system above, but we'll keep this as a fallback
        return false;
      }
      
      // Check if the folder name might be a match for our track name:
      // 1. Direct match (normalized)
      if (folderName.toLowerCase() === trackId.toLowerCase()) return true;
      
      // 2. Partial word match
      const requestedWords = trackId.toLowerCase().split('-');
      const folderWords = folderName.toLowerCase().split('-');
      
      // Check if enough words match between the two
      const matchingWords = requestedWords.filter(word => 
        folderWords.some(fWord => fWord.includes(word) || word.includes(fWord))
      );
      
      return matchingWords.length >= Math.min(2, requestedWords.length);
    });
    
    if (folderMatch?.Prefix) {
      // We found a folder that potentially contains our track
      // Try each potential filename
      for (const fileName of filesToTry) {
        const trackPath = folderMatch.Prefix + fileName;
        
        // Test if the file actually exists
        try {
          const testCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: trackPath,
          });
          await s3Client.send(testCommand);
          
          // File exists, use this path
          console.log(`[DIRECT-S3] Found matching file at ${trackPath}`);
          return trackPath;
        } catch (error: any) {
          if (error.code !== 'NoSuchKey') {
            throw error; // Re-throw unexpected errors
          }
          // File doesn't exist, try next filename
        }
      }
      
      // If we get here, none of the files were found in the matching folder
      console.log(`[DIRECT-S3] Matching folder found but no matching files exist: ${folderMatch.Prefix}`);
    }
    
    // If we got here, we couldn't find a matching file
    console.log(`[DIRECT-S3] Could not find any matching file for ${requestedPath}`);
    
    if (isNumericId) {
      console.error(`[DIRECT-S3] Failed to map Strapi ID ${trackId} to any S3 path. This suggests a metadata mismatch between Strapi and S3.`);
    }
    
    // As a last resort in development mode, return the first path we tried
    if (process.env.NODE_ENV === 'development') {
      const fallbackPath = `tracks/${trackId}/${filesToTry[0]}`;
      console.log(`[DIRECT-S3] Development mode: returning fallback path ${fallbackPath}`);
      return fallbackPath;
    }
    
    return null;
  } catch (error) {
    console.error('[DIRECT-S3] Error finding track file path:', error);
    
    // In development mode, return a mock path when all else fails
    if (process.env.NODE_ENV === 'development') {
      const parts = requestedPath.split('/');
      if (parts.length >= 3) {
        const trackId = parts[1];
        const assetType = parts[2].split('.')[0];
        
        // Determine a fallback filename
        let fallbackFile = 'main.mp3';
        if (assetType === 'image' || assetType === 'cover') {
          fallbackFile = 'cover.jpg';
        }
        
        const mockPath = `tracks/${trackId}/${fallbackFile}`;
        console.log(`[DIRECT-S3] Development mode: returning emergency fallback path ${mockPath}`);
        return mockPath;
      }
    }
    
    return null;
  }
}

// Handle OPTIONS requests for CORS preflight
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}