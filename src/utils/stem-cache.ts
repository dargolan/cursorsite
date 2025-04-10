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
 * Validate a cache item to ensure the URL matches the track and stem
 * @param key - The cache key
 * @param url - The URL to validate
 * @returns Whether the URL is valid for the given key
 */
export function validateCacheItem(key: string, url: string): boolean {
  try {
    // If there's no URL, it's invalid
    if (!url) {
      console.log(`[Cache] Invalid: Empty URL for key ${key}`);
      return false;
    }

    const [trackId, trackTitle, stemName] = key.split(':');
    
    if (!trackTitle || !stemName) {
      console.log(`[Cache] Invalid: Malformed key ${key}`);
      return false;
    }

    // Extract filename from URL
    let filename = '';
    try {
      const urlObj = new URL(url);
      filename = urlObj.pathname.split('/').pop() || '';
    } catch (e) {
      // If URL parsing fails, try to get the filename from the last part of the URL
      const parts = url.split('/');
      filename = parts[parts.length - 1];
    }

    if (!filename) {
      console.log(`[Cache] Invalid: Could not extract filename from URL ${url} for key ${key}`);
      return false;
    }

    console.log(`[Cache] Validating ${stemName} (${trackTitle}) with filename: ${filename}`);

    // Normalize strings for comparison
    const normalizedTrackTitle = trackTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedFilename = filename.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedStemName = stemName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check stem name in filename
    if (!normalizedFilename.includes(normalizedStemName)) {
      console.log(`[Cache] Invalid: Filename ${filename} does not include stem name ${stemName}`);
      return false;
    }

    // Special handling for Lo-Fi Beats
    if (normalizedTrackTitle.includes('lofibeat') || normalizedTrackTitle.includes('lofi')) {
      const lofiVariations = ['lofi', 'lofibeat', 'lofibeatsdemo', 'lofibeats', 'lofibeat1', 'lobeat'];
      const matchesLofi = lofiVariations.some(v => normalizedFilename.includes(v));
      
      if (!matchesLofi) {
        console.log(`[Cache] Invalid: Lo-Fi track ${trackTitle} does not match filename ${filename}`);
        return false;
      }
      
      console.log(`[Cache] Valid: Lo-Fi track ${trackTitle} matches filename ${filename}`);
      return true;
    }

    // Special handling for Dramatic Epic tracks
    if (normalizedTrackTitle.includes('dramatic') || normalizedTrackTitle.includes('epic')) {
      const dramaticVariations = ['dramatic', 'epic', 'countdown', 'drama', 'cinema'];
      const matchesDramatic = dramaticVariations.some(v => normalizedFilename.includes(v));
      
      if (!matchesDramatic) {
        console.log(`[Cache] Invalid: Dramatic track ${trackTitle} does not match filename ${filename}`);
        return false;
      }
      
      console.log(`[Cache] Valid: Dramatic track ${trackTitle} matches filename ${filename}`);
      return true;
    }

    // Check track title in filename for all other tracks
    // We use includes rather than exact match because filenames often contain additional info
    if (!normalizedFilename.includes(normalizedTrackTitle) && 
        !normalizedTrackTitle.includes(normalizedFilename)) {
      
      // Handle specific track title variations
      if (normalizedTrackTitle.includes('longopener') && normalizedFilename.includes('opener')) {
        console.log(`[Cache] Valid: Long Opener track variation matches filename ${filename}`);
        return true;
      }
      
      if (normalizedTrackTitle.includes('crazymeme') && normalizedFilename.includes('meme')) {
        console.log(`[Cache] Valid: Crazy Meme track variation matches filename ${filename}`);
        return true;
      }
      
      console.log(`[Cache] Invalid: Track title ${trackTitle} does not match filename ${filename}`);
      return false;
    }
    
    console.log(`[Cache] Valid: ${stemName} for ${trackTitle} matches filename ${filename}`);
    return true;
  } catch (error) {
    console.error(`[Cache] Error validating cache item ${key}:`, error);
    return false;
  }
}

/**
 * Initialize the stem URL cache system
 * This will be called when the module is imported
 */
export function initStemUrlCache(): void {
  console.log('[Cache] Initializing stem URL cache');
  
  try {
    // Get the current cache
    const cacheData = localStorage.getItem('stemUrlCache');
    if (!cacheData) {
      // No cache exists yet
      console.log('[Cache] No existing cache found. Creating new cache.');
      localStorage.setItem('stemUrlCache', JSON.stringify({}));
      return;
    }
    
    const cache = JSON.parse(cacheData);
    const validatedCache: Record<string, string> = {};
    let validCount = 0;
    let invalidCount = 0;
    
    // Validate each entry
    for (const [key, url] of Object.entries(cache)) {
      if (validateCacheItem(key, url as string)) {
        validatedCache[key] = url as string;
        validCount++;
      } else {
        invalidCount++;
      }
    }
    
    console.log(`[Cache] Validation complete: ${validCount} valid entries, ${invalidCount} invalid entries removed`);
    
    // Save the validated cache
    localStorage.setItem('stemUrlCache', JSON.stringify(validatedCache));
    
  } catch (error) {
    console.error('[Cache] Error initializing stem URL cache:', error);
    // Reset to empty cache on error
    localStorage.setItem('stemUrlCache', JSON.stringify({}));
  }
}

/**
 * Cache a stem URL with validation
 * @param trackId - The ID of the track
 * @param trackTitle - The title of the track
 * @param stemName - The name of the stem
 * @param url - The URL to cache
 */
export function cacheStemUrl(
  trackId: string,
  trackTitle: string,
  stemName: string,
  url: string
): void {
  if (!url || !trackTitle || !stemName) {
    console.log(`[Cache] Not caching empty URL for ${stemName} (${trackTitle})`);
    return;
  }

  try {
    const key = `${trackId}:${trackTitle}:${stemName}`;
    
    // Validate the URL matches the track and stem before caching
    if (!validateCacheItem(key, url)) {
      console.warn(`[Cache] Not caching URL due to validation failure: ${url} for ${stemName} (${trackTitle})`);
      return;
    }
    
    const cacheData = localStorage.getItem('stemUrlCache');
    const cache = cacheData ? JSON.parse(cacheData) : {};
    
    // Update the cache
    cache[key] = url;
    localStorage.setItem('stemUrlCache', JSON.stringify(cache));
    
    console.log(`[Cache] Cached URL for ${stemName} (${trackTitle}) to localStorage`);
  } catch (error) {
    console.error(`[Cache] Error caching stem URL for ${stemName} (${trackTitle}):`, error);
  }
}

// Auto-initialize the cache if in a browser environment
if (typeof window !== 'undefined') {
  // Run as a microtask to ensure it's executed after module initialization
  Promise.resolve().then(() => {
    initStemUrlCache();
  });
}