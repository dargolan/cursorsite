// Client-side safe version of ID mapping utilities
// This doesn't use Node.js modules like fs/path and is safe for browser usage

// In-memory cache to prevent repeated API calls for the same ID
const memoryCache: Record<string, string> = {};

/**
 * Get the UUID for a Strapi ID - this makes an API call
 * @param strapiId The numeric Strapi ID 
 * @returns Promise that resolves to the UUID or null
 */
export async function getUuidForId(strapiId: string): Promise<string | null> {
  try {
    // First check the memory cache
    if (memoryCache[strapiId]) {
      console.log(`[CLIENT-MAPPING] Using in-memory cached UUID for ID ${strapiId}: ${memoryCache[strapiId]}`);
      return memoryCache[strapiId];
    }
    
    console.log(`[CLIENT-MAPPING] Fetching UUID for ID ${strapiId} from API`);
    
    const response = await fetch(`/api/debug/uuid-mapping?action=lookup&strapiId=${strapiId}`);
    if (!response.ok) {
      console.error(`[CLIENT-MAPPING] API error looking up UUID for ID ${strapiId}:`, response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data.uuid) {
      // Save to memory cache
      memoryCache[strapiId] = data.uuid;
      console.log(`[CLIENT-MAPPING] Found and cached UUID ${data.uuid} for ID ${strapiId}`);
    } else {
      console.log(`[CLIENT-MAPPING] No UUID found for ID ${strapiId}`);
    }
    
    return data.uuid || null;
  } catch (error) {
    console.error(`[CLIENT-MAPPING] Error looking up UUID for ID ${strapiId}:`, error);
    return null;
  }
}

/**
 * Get all ID-to-UUID mappings - this makes an API call
 * @returns Promise that resolves to the mappings object
 */
export async function getAllMappings(): Promise<Record<string, string>> {
  try {
    console.log('[CLIENT-MAPPING] Fetching all mappings from API');
    
    const response = await fetch('/api/debug/uuid-mapping?action=list-mappings');
    if (!response.ok) {
      console.error('[CLIENT-MAPPING] API error getting mappings:', response.status, response.statusText);
      return {};
    }
    
    const data = await response.json();
    
    if (data.mappings) {
      // Update memory cache with all mappings
      Object.entries(data.mappings).forEach(([id, uuid]) => {
        memoryCache[id] = uuid as string;
      });
      
      console.log(`[CLIENT-MAPPING] Retrieved ${Object.keys(data.mappings).length} mappings`);
    }
    
    return data.mappings || {};
  } catch (error) {
    console.error('[CLIENT-MAPPING] Error getting all mappings:', error);
    return {};
  }
}

/**
 * Add a mapping - this makes an API call
 * @param strapiId The Strapi ID
 * @param uuid The UUID to map to
 * @returns Promise that resolves to success status
 */
export async function addMapping(strapiId: string, uuid: string): Promise<boolean> {
  try {
    console.log(`[CLIENT-MAPPING] Adding mapping: ${strapiId} -> ${uuid}`);
    
    const response = await fetch(`/api/debug/uuid-mapping?action=add-mapping&strapiId=${strapiId}&uuid=${uuid}`);
    if (!response.ok) {
      console.error('[CLIENT-MAPPING] API error adding mapping:', response.status, response.statusText);
      return false;
    }
    
    // Update memory cache
    memoryCache[strapiId] = uuid;
    
    return true;
  } catch (error) {
    console.error('[CLIENT-MAPPING] Error adding mapping:', error);
    return false;
  }
}

/**
 * Clear all mappings in cache - this makes an API call
 * @returns Promise that resolves to success status
 */
export async function clearCache(): Promise<boolean> {
  try {
    console.log('[CLIENT-MAPPING] Clearing all mappings');
    
    const response = await fetch('/api/debug/uuid-mapping?action=clear-mappings');
    if (!response.ok) {
      console.error('[CLIENT-MAPPING] API error clearing mappings:', response.status, response.statusText);
      return false;
    }
    
    // Clear memory cache
    Object.keys(memoryCache).forEach(key => delete memoryCache[key]);
    
    return true;
  } catch (error) {
    console.error('[CLIENT-MAPPING] Error clearing mappings:', error);
    return false;
  }
}

// Export default for compatibility with the original module
export default {
  getUuidForId,
  getAllMappings,
  addMapping,
  clearCache
}; 