'use server';

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

// Type for the mapping cache
interface MappingCache {
  idToUuid: Record<string, string>;
  lastUpdated: string;
}

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

// In-memory cache
let mappingCache: MappingCache = {
  idToUuid: {},
  lastUpdated: new Date().toISOString()
};

/**
 * Get the UUID for a given Strapi ID
 * @param strapiId The numeric Strapi ID
 * @returns The corresponding UUID, or null if not found
 */
export async function getUuidForId(strapiId: string): Promise<string | null> {
  // Check memory cache first
  if (mappingCache.idToUuid[strapiId]) {
    console.log(`[ID-MAPPING] Found cached UUID for ID ${strapiId}: ${mappingCache.idToUuid[strapiId]}`);
    return mappingCache.idToUuid[strapiId];
  }

  // Try to discover UUID through dynamic fetching from Strapi
  console.log(`[ID-MAPPING] No UUID found for ID ${strapiId}, attempting to fetch from Strapi`);
  
  try {
    // Attempt to fetch from dynamic mapping service
    const response = await fetch(`/api/debug/uuid-mapping?action=lookup&strapiId=${strapiId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.uuid) {
        console.log(`[ID-MAPPING] Found UUID ${data.uuid} for ID ${strapiId} via API`);
        mappingCache.idToUuid[strapiId] = data.uuid;
        return data.uuid;
      }
    }
  } catch (error) {
    console.error(`[ID-MAPPING] Error fetching UUID for ID ${strapiId}:`, error);
  }
  
  console.log(`[ID-MAPPING] No UUID found for ID ${strapiId}`);
  return null;
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
}

/**
 * Clear the entire cache
 */
export async function clearCache(): Promise<void> {
  mappingCache = {
    idToUuid: {},
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Attempt to discover the UUID for a Strapi ID by examining the files in S3
 * This function uses file structure and metadata to make an educated guess
 * @param strapiId The numeric Strapi ID
 * @returns The discovered UUID, or null if not found
 */
async function discoverUuidForId(strapiId: string): Promise<string | null> {
  try {
    // Step 1: List all folders in the tracks/ directory to find UUID folders
    const uuidFolders = await listUuidFolders();
    
    if (uuidFolders.length === 0) {
      console.log('[ID-MAPPING] No UUID folders found in S3');
      return null;
    }
    
    // Step 2: Try to associate the strapiId with a UUID folder
    // This is tricky since there's no direct relationship in the folder structure
    // We'll use several strategies:
    
    // First, check if any folder contains a metadata file with the Strapi ID
    for (const uuid of uuidFolders) {
      try {
        // Try to get metadata.json if it exists (this is speculative - depends on your setup)
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
          // No metadata file or error reading it, continue to next strategy
        }
      } catch (error) {
        // Error accessing folder, continue to the next one
      }
    }
    
    // If we haven't found a match, we won't try to infer by order, as that's unreliable
    // Instead, we'll return null and rely on dynamic fetching from Strapi
    
    // If all strategies failed, return null
    console.log(`[ID-MAPPING] Could not discover UUID for ID ${strapiId}`);
    return null;
  } catch (error) {
    console.error(`[ID-MAPPING] Error discovering UUID for ID ${strapiId}:`, error);
    return null;
  }
}

async function listUuidFolders(): Promise<string[]> {
  try {
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

// Export as default for compatibility
export default {
  getUuidForId,
  getAllMappings,
  addMapping,
  clearCache
}; 