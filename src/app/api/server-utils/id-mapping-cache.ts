import fs from 'fs';
import path from 'path';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

// Cache file path
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'id-uuid-mapping.json');

// Type for the mapping cache
interface MappingCache {
  idToUuid: Record<string, string>;
  lastUpdated: string;
}

// Create S3 client
const awsCredentialsConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

// Only create a real S3 client if credentials are available
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
console.log(`[ID-MAPPING] AWS credentials ${awsCredentialsConfigured ? 'configured' : 'NOT configured'}`);
if (!awsCredentialsConfigured) {
  console.log('[ID-MAPPING] Running in development mode without AWS credentials');
  console.log('[ID-MAPPING] S3 operations will fail - this is expected in development');
}

// Bucket name
const bucketName = process.env.AWS_BUCKET_NAME || 'wave-cave-audio';

// Strapi API URL and token
const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
const STRAPI_API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

// Initialize the cache
let mappingCache: MappingCache = {
  idToUuid: {},
  lastUpdated: new Date().toISOString()
};

// Load the cache on startup
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  if (fs.existsSync(CACHE_FILE)) {
    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    mappingCache = JSON.parse(cacheContent);
    console.log(`[ID-MAPPING] Loaded ${Object.keys(mappingCache.idToUuid).length} mappings from cache`);
  } else {
    // Create an empty cache file
    saveCache();
    console.log('[ID-MAPPING] Created new cache file');
  }
} catch (error) {
  console.error('[ID-MAPPING] Error loading cache:', error);
}

// Save the cache to disk
function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(mappingCache, null, 2), 'utf-8');
  } catch (error) {
    console.error('[ID-MAPPING] Error saving cache:', error);
  }
}

/**
 * Query Strapi directly for track UUID
 * @param strapiId The track ID to look up
 * @returns UUID if found, null otherwise
 */
async function queryStrapiForUuid(strapiId: string): Promise<string | null> {
  try {
    console.log(`[ID-MAPPING] Querying Strapi for UUID of track ${strapiId}`);
    
    // Construct headers with authorization if token is available
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }
    
    // Query Strapi for this track
    const response = await fetch(`${STRAPI_API_URL}/tracks/${strapiId}?populate=*`, {
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`[ID-MAPPING] Strapi query failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (!data?.data) {
      console.error('[ID-MAPPING] No data returned from Strapi');
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
      console.log(`[ID-MAPPING] Found UUID ${uuid} for track ${strapiId} in Strapi`);
      return uuid;
    }
    
    console.log(`[ID-MAPPING] No UUID found for track ${strapiId} in Strapi`);
    return null;
  } catch (error) {
    console.error(`[ID-MAPPING] Error querying Strapi for track ${strapiId}:`, error);
    return null;
  }
}

/**
 * Get the UUID for a given Strapi ID
 * @param strapiId The numeric Strapi ID
 * @returns The corresponding UUID, or null if not found
 */
export async function getUuidForId(strapiId: string): Promise<string | null> {
  // Check if we already have this mapping cached
  if (mappingCache.idToUuid[strapiId]) {
    console.log(`[ID-MAPPING] Found cached UUID for ID ${strapiId}: ${mappingCache.idToUuid[strapiId]}`);
    return mappingCache.idToUuid[strapiId];
  }
  
  console.log(`[ID-MAPPING] No cached UUID for ID ${strapiId}, querying Strapi...`);
  
  // Try to query Strapi first as it's the most reliable source
  const strapiUuid = await queryStrapiForUuid(strapiId);
  if (strapiUuid) {
    // Cache the mapping for future use
    mappingCache.idToUuid[strapiId] = strapiUuid;
    mappingCache.lastUpdated = new Date().toISOString();
    saveCache();
    console.log(`[ID-MAPPING] Found and cached UUID from Strapi: ${strapiId} -> ${strapiUuid}`);
    return strapiUuid;
  }
  
  // If Strapi doesn't have it, try to find the UUID in S3
  console.log(`[ID-MAPPING] No UUID found in Strapi for ID ${strapiId}, searching S3...`);
  const s3Uuid = await discoverUuidForId(strapiId);
  
  if (s3Uuid) {
    // Cache the mapping for future use
    mappingCache.idToUuid[strapiId] = s3Uuid;
    mappingCache.lastUpdated = new Date().toISOString();
    saveCache();
    console.log(`[ID-MAPPING] Discovered and cached UUID from S3: ${strapiId} -> ${s3Uuid}`);
    return s3Uuid;
  }
  
  console.log(`[ID-MAPPING] No UUID found for ID ${strapiId} in any source`);
  return null;
}

/**
 * Attempt to discover the UUID for a Strapi ID by examining the files in S3
 * This function uses file structure and metadata to make an educated guess
 * @param strapiId The numeric Strapi ID
 * @returns The discovered UUID, or null if not found
 */
async function discoverUuidForId(strapiId: string): Promise<string | null> {
  try {
    // Check if S3 client is available
    if (!s3Client || !awsCredentialsConfigured) {
      console.log('[ID-MAPPING] Cannot discover UUID: AWS credentials not configured');
      return null;
    }
    
    // Step 1: List all folders in the tracks/ directory to find UUID folders
    const uuidFolders = await listUuidFolders();
    
    if (uuidFolders.length === 0) {
      console.log('[ID-MAPPING] No UUID folders found in S3');
      return null;
    }
    
    // Step 2: Try to associate the strapiId with a UUID folder
    // First, check if any folder contains a metadata file with the Strapi ID
    for (const uuid of uuidFolders) {
      try {
        // Try to get metadata.json if it exists
        const metadataPath = `tracks/${uuid}/metadata.json`;
        const metadataCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: metadataPath
        });
        
        try {
          const response = await s3Client.send(metadataCommand);
          if (response.Body) {
            const metadata = await response.Body.transformToString();
            const parsedMetadata = JSON.parse(metadata);
            
            // Check if this metadata contains our strapiId
            if (parsedMetadata.strapiId === strapiId || parsedMetadata.id === strapiId) {
              console.log(`[ID-MAPPING] Found UUID ${uuid} for ID ${strapiId} via metadata`);
              return uuid;
            }
          }
        } catch (error) {
          // No metadata file or error reading it, continue to next folder
        }
      } catch (error) {
        // Error accessing folder, continue to the next one
      }
    }
    
    // If all strategies failed, return null
    console.log(`[ID-MAPPING] Could not discover UUID for ID ${strapiId} in S3`);
    return null;
  } catch (error) {
    console.error(`[ID-MAPPING] Error discovering UUID for ID ${strapiId}:`, error);
    return null;
  }
}

/**
 * List all UUID folders in the S3 bucket
 * @returns Array of UUID strings
 */
async function listUuidFolders(): Promise<string[]> {
  try {
    // Check if S3 client is available
    if (!s3Client || !awsCredentialsConfigured) {
      console.log('[ID-MAPPING] Cannot list UUID folders: AWS credentials not configured');
      return [];
    }
    
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
    }).map(prefix => {
      const folderName = prefix.Prefix?.replace('tracks/', '').replace('/', '') || '';
      return folderName;
    }) || [];
    
    return uuidFolders;
  } catch (error) {
    console.error('[ID-MAPPING] Error listing UUID folders:', error);
    return [];
  }
}

/**
 * Get all cached mappings
 * @returns The current mapping cache
 */
export async function getAllMappings(): Promise<Record<string, string>> {
  return { ...mappingCache.idToUuid };
}

/**
 * Manually add a mapping
 * @param strapiId The Strapi ID
 * @param uuid The S3 UUID
 */
export async function addMapping(strapiId: string, uuid: string): Promise<void> {
  mappingCache.idToUuid[strapiId] = uuid;
  mappingCache.lastUpdated = new Date().toISOString();
  saveCache();
}

/**
 * Clear the entire cache
 */
export async function clearCache(): Promise<void> {
  mappingCache = {
    idToUuid: {},
    lastUpdated: new Date().toISOString()
  };
  saveCache();
  console.log('[ID-MAPPING] Cache cleared');
}

// Export the module
export default {
  getUuidForId,
  getAllMappings,
  addMapping,
  clearCache
}; 