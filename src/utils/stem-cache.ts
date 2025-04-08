// Cache for storing discovered stem URLs to avoid repeated API calls
export const stemUrlCache: Record<string, string> = {};

// Save successful URLs to persistent storage
export function saveStemUrlToCache(trackTitle: string, stemName: string, url: string) {
  const cacheKey = `${trackTitle}:${stemName}`;
  stemUrlCache[cacheKey] = url;
  
  try {
    // Try to persist to local storage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      // Store in local storage for persistence between page reloads
      const existingCache = localStorage.getItem('stemUrlCache');
      const cache = existingCache ? JSON.parse(existingCache) : {};
      cache[cacheKey] = url;
      localStorage.setItem('stemUrlCache', JSON.stringify(cache));
      console.log(`Cached URL for ${stemName} (${trackTitle}) to localStorage`);
    }
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

// Initialize cache from local storage
export function initStemUrlCache() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedCache = localStorage.getItem('stemUrlCache');
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        Object.assign(stemUrlCache, parsedCache);
        console.log('Loaded stem URL cache from localStorage:', Object.keys(parsedCache).length, 'entries');
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
  }
} 