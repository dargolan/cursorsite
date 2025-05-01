// Local storage key for stem URL cache
const STEM_CACHE_KEY = 'stemUrlCache';

/**
 * Creates a cache key for a stem URL
 * @param trackId - The ID of the track
 * @param trackTitle - The title of the track
 * @param stemName - The name of the stem
 * @returns The cache key
 */
export function createStemCacheKey(trackId: string, trackTitle: string, stemName: string): string {
  return `${trackId}:${trackTitle}:${stemName}`;
}

/**
 * Save a stem URL to the cache
 * @param trackId - The ID of the track 
 * @param trackTitle - The title of the track
 * @param stemName - The name of the stem
 * @param url - The URL to cache
 */
export function saveStemUrlToCache(trackId: string, trackTitle: string, stemName: string, url: string): void {
  try {
    const cacheKey = createStemCacheKey(trackId, trackTitle, stemName);
    const existingCache = localStorage.getItem(STEM_CACHE_KEY);
    let cache = existingCache ? JSON.parse(existingCache) : {};
    
    // Store the URL in the cache
    cache[cacheKey] = url;
    
    // Save the updated cache to localStorage
    localStorage.setItem(STEM_CACHE_KEY, JSON.stringify(cache));
    console.log(`[CACHE] Cached URL for ${stemName} (${trackTitle}) to localStorage`);
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

/**
 * Get a stem URL from the cache
 * @param trackId - The ID of the track
 * @param trackTitle - The title of the track
 * @param stemName - The name of the stem
 * @returns The cached URL, or null if not found
 */
export function getStemUrlFromCache(trackId: string, trackTitle: string, stemName: string): string | null {
  try {
    const cacheKey = createStemCacheKey(trackId, trackTitle, stemName);
    const existingCache = localStorage.getItem(STEM_CACHE_KEY);
    
    if (!existingCache) {
      return null;
    }
    
    const cache = JSON.parse(existingCache);
    return cache[cacheKey] || null;
  } catch (e) {
    console.warn('Failed to read from localStorage:', e);
    return null;
  }
}

/**
 * Clear all stem URL caches
 */
export function clearAllStemUrlCaches(): void {
  try {
    localStorage.removeItem(STEM_CACHE_KEY);
    console.log('[CACHE] Cleared all stem URL caches');
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

/**
 * Clear the stem URL cache for a specific stem
 * @param trackId - The ID of the track
 * @param trackTitle - The title of the track
 * @param stemName - The name of the stem
 */
export function clearStemUrlCache(trackId: string, trackTitle: string, stemName: string): void {
  try {
    const cacheKey = createStemCacheKey(trackId, trackTitle, stemName);
    const existingCache = localStorage.getItem(STEM_CACHE_KEY);
    
    if (existingCache) {
      const cache = JSON.parse(existingCache);
      
      if (cache[cacheKey]) {
        delete cache[cacheKey];
        localStorage.setItem(STEM_CACHE_KEY, JSON.stringify(cache));
        console.log(`[CACHE] Cleared cache for ${stemName} (${trackTitle})`);
      }
    }
  } catch (e) {
    console.warn('Failed to clear stem URL cache:', e);
  }
}

/**
 * Initialize the stem URL cache system
 * This will be called when the module is imported
 */
export function initStemUrlCache(): void {
  console.log('[CACHE] Initializing stem URL cache');
  
  try {
    // Get the current cache
    const cacheData = localStorage.getItem(STEM_CACHE_KEY);
    if (!cacheData) {
      // No cache exists yet
      console.log('[CACHE] No existing cache found. Creating new cache.');
      localStorage.setItem(STEM_CACHE_KEY, JSON.stringify({}));
    }
  } catch (error) {
    console.error('[CACHE] Error initializing stem URL cache:', error);
    // Reset to empty cache on error
    localStorage.setItem(STEM_CACHE_KEY, JSON.stringify({}));
  }
}