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
    }
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

// Get stem URL from cache
export function getStemUrlFromCache(trackTitle: string, stemName: string): string | null {
  const cacheKey = `${trackTitle}:${stemName}`;
  return stemUrlCache[cacheKey] || null;
}

// Initialize cache from local storage
export function initStemUrlCache() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedCache = localStorage.getItem('stemUrlCache');
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        Object.assign(stemUrlCache, parsedCache);
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
  }
} 