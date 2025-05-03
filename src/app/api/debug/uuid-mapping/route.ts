import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import idMappingCache, { getAllMappings, addMapping, clearCache } from '../../server-utils/id-mapping-cache';

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

// Strapi API URL and token
const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
const STRAPI_API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

/**
 * Query Strapi directly for UUID from Track ID
 * @param trackId Track ID to look up
 * @returns UUID if found, null otherwise
 */
async function queryStrapiForUuid(trackId: string): Promise<string | null> {
  try {
    console.log(`[UUID-MAPPING] Querying Strapi for UUID of track ${trackId}`);
    
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
      console.error(`[UUID-MAPPING] Strapi query failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (!data?.data) {
      console.error('[UUID-MAPPING] No data returned from Strapi');
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
      console.log(`[UUID-MAPPING] Found UUID ${uuid} for track ${trackId} in Strapi`);
      
      // Save this to our mapping cache
      addMapping(trackId, uuid);
      
      return uuid;
    }
    
    console.log(`[UUID-MAPPING] No UUID found for track ${trackId} in Strapi`);
    return null;
  } catch (error) {
    console.error(`[UUID-MAPPING] Error querying Strapi for track ${trackId}:`, error);
    return null;
  }
}

/**
 * Fetch all tracks from Strapi and build complete ID to UUID mapping
 * @returns Mapping of track IDs to UUIDs
 */
async function buildCompleteMapping(): Promise<Record<string, string>> {
  try {
    console.log('[UUID-MAPPING] Building complete mapping from Strapi');
    
    // Construct headers with authorization if token is available
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }
    
    // Query Strapi for all tracks
    const response = await fetch(`${STRAPI_API_URL}/tracks?pagination[pageSize]=100&populate=*`, {
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error(`[UUID-MAPPING] Strapi query failed: ${response.status}`);
      return {};
    }
    
    const data = await response.json();
    if (!data?.data || !Array.isArray(data.data)) {
      console.error('[UUID-MAPPING] Invalid data returned from Strapi');
      return {};
    }
    
    // Build mapping
    const mapping: Record<string, string> = {};
    let mappingsFound = 0;
    
    for (const track of data.data) {
      const trackId = track.id?.toString();
      if (!trackId) continue;
      
      const attributes = track.attributes || {};
      const uuid = attributes.uuid || 
                   attributes.s3_uuid || 
                   attributes.s3Id || 
                   attributes.s3_id || 
                   attributes.s3TrackId || 
                   attributes.s3_track_id;
      
      if (uuid) {
        mapping[trackId] = uuid;
        mappingsFound++;
        
        // Add to our mapping cache
        addMapping(trackId, uuid);
      }
    }
    
    console.log(`[UUID-MAPPING] Found ${mappingsFound} mappings from Strapi`);
    return mapping;
  } catch (error) {
    console.error('[UUID-MAPPING] Error building mapping from Strapi:', error);
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';
    
    // List all available UUIDs in S3
    if (action === 'list-uuids') {
      const uuids = await listAvailableUuids();
      return NextResponse.json({
        uuids,
        count: uuids.length
      });
    }
    
    // List current ID to UUID mappings
    if (action === 'list-mappings') {
      // Get cached mappings
      const cachedMappings = await getAllMappings();
      
      // Get mappings directly from Strapi for comparison/completeness
      const strapiMappings = await buildCompleteMapping();
      
      // Merge them giving priority to Strapi mappings
      const combinedMappings = {
        ...cachedMappings,
        ...strapiMappings
      };
      
      return NextResponse.json({
        mappings: combinedMappings,
        cachedCount: Object.keys(cachedMappings).length,
        strapiCount: Object.keys(strapiMappings).length,
        totalCount: Object.keys(combinedMappings).length
      });
    }
    
    // Add a new mapping
    if (action === 'add-mapping') {
      const strapiId = searchParams.get('strapiId');
      const uuid = searchParams.get('uuid');
      
      if (!strapiId || !uuid) {
        return NextResponse.json({ error: 'Missing strapiId or uuid parameter' }, { status: 400 });
      }
      
      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
        return NextResponse.json({ error: 'Invalid UUID format' }, { status: 400 });
      }
      
      // Add to our mapping system
      addMapping(strapiId, uuid);
      
      return NextResponse.json({
        success: true,
        message: `Added mapping: Strapi ID ${strapiId} -> UUID ${uuid}`,
        mappings: getAllMappings()
      });
    }
    
    // Clear all mappings
    if (action === 'clear-mappings') {
      clearCache();
      return NextResponse.json({
        success: true,
        message: 'All mappings have been cleared'
      });
    }
    
    // Lookup UUID for a specific ID
    if (action === 'lookup') {
      const strapiId = searchParams.get('strapiId');
      
      if (!strapiId) {
        return NextResponse.json({ error: 'Missing strapiId parameter' }, { status: 400 });
      }
      
      // First check if we have it in cache
      let uuid = await idMappingCache.getUuidForId(strapiId);
      
      // If not in cache, try Strapi directly
      if (!uuid) {
        console.log(`[UUID-MAPPING] No cached mapping for ID ${strapiId}, trying Strapi directly`);
        uuid = await queryStrapiForUuid(strapiId);
      }
      
      return NextResponse.json({
        strapiId,
        uuid,
        found: !!uuid,
        source: uuid ? (uuid === await idMappingCache.getUuidForId(strapiId) ? 'cache' : 'strapi') : 'not_found',
        message: uuid 
          ? `Found UUID ${uuid} for Strapi ID ${strapiId}` 
          : `Could not find UUID for Strapi ID ${strapiId}`
      });
    }
    
    // Sync mappings from Strapi
    if (action === 'sync-from-strapi') {
      const mappings = await buildCompleteMapping();
      
      return NextResponse.json({
        success: true,
        message: `Synced ${Object.keys(mappings).length} mappings from Strapi`,
        mappings
      });
    }
    
    // Default response
    return NextResponse.json({
      message: 'UUID Mapping API',
      availableActions: ['list-uuids', 'list-mappings', 'add-mapping', 'clear-mappings', 'lookup', 'sync-from-strapi'],
      usage: {
        'list-uuids': '/api/debug/uuid-mapping?action=list-uuids',
        'list-mappings': '/api/debug/uuid-mapping?action=list-mappings',
        'add-mapping': '/api/debug/uuid-mapping?action=add-mapping&strapiId=5&uuid=abcd-1234',
        'clear-mappings': '/api/debug/uuid-mapping?action=clear-mappings',
        'lookup': '/api/debug/uuid-mapping?action=lookup&strapiId=5',
        'sync-from-strapi': '/api/debug/uuid-mapping?action=sync-from-strapi'
      }
    });
  } catch (error: any) {
    console.error('[UUID MAPPING] Error:', error);
    return NextResponse.json({
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * List all available UUIDs in the S3 bucket
 */
async function listAvailableUuids(): Promise<string[]> {
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
    console.error('[UUID MAPPING] Error listing UUIDs:', error);
    return [];
  }
} 