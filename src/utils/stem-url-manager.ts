/**
 * Utility for finding and managing stem file URLs
 * Handles caching and discovery of stem audio files
 */

import { STRAPI_URL } from '../services/strapi';

// Cache for storing discovered stem URLs to avoid repeated API calls
const stemUrlCache: Record<string, string> = {};

// Initialize cache from local storage
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

/**
 * Save successful URLs to persistent storage
 */
export function saveStemUrlToCache(trackTitle: string, stemName: string, url: string): void {
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

/**
 * Generate a list of possible stem URL patterns to try
 */
export function generateStemUrlPatterns(stemName: string, trackTitle: string): string[] {
  // Normalize stemName and trackTitle
  const cleanTrack = trackTitle.replace(/[^\w\s]/g, '').replace(/\s+/g, '_').toLowerCase();
  const cleanStem = stemName.replace(/[^\w\s]/g, '').replace(/\s+/g, '_').toLowerCase();
  
  // Create various patterns that might match the actual file
  return [
    // Pattern 1: stem_track.mp3
    `${cleanStem}_${cleanTrack}.mp3`,
    
    // Pattern 2: track_stem.mp3
    `${cleanTrack}_${cleanStem}.mp3`,
    
    // Pattern 3: stem-track.mp3
    `${cleanStem}-${cleanTrack}.mp3`,
    
    // Pattern 4: stem/track.mp3
    `${cleanStem}/${cleanTrack}.mp3`,
  ];
}

/**
 * Check if a URL exists by making a HEAD request
 */
export async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Try a list of URLs in order until one works
 */
export async function findFirstValidUrl(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    if (await urlExists(url)) {
      return url;
    }
  }
  return null;
}

/**
 * Discover the URL for a stem file
 */
export async function findStemFileUrl(stemName: string, trackTitle: string): Promise<string | null> {
  // Try to get from cache first
  const cacheKey = `${trackTitle}:${stemName}`;
  if (stemUrlCache[cacheKey]) {
    return stemUrlCache[cacheKey];
  }
  
  try {
    // Create stem name variants to search for
    const stemVariants = [
      stemName,
      stemName.toLowerCase(),
      stemName.replace(/\s+/g, '_'),
      stemName.replace(/\s+/g, '-'),
    ];
    
    // Create track title variants
    const trackVariants = [
      trackTitle,
      trackTitle.toLowerCase(),
      trackTitle.replace(/\s+/g, '_'),
      trackTitle.replace(/\s+/g, '-'),
    ];
    
    // Try direct API query
    const searchResults = await Promise.all(
      stemVariants.flatMap(stem => 
        trackVariants.map(track => 
          fetch(`${STRAPI_URL}/api/upload/search/${stem}/${track}`)
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        )
      )
    );
    
    // Find first valid result
    const validResult = searchResults.find(res => res && res.url);
    if (validResult) {
      const url = `${STRAPI_URL}${validResult.url}`;
      saveStemUrlToCache(trackTitle, stemName, url);
      return url;
    }
    
    // Fallback: try pattern matching
    const patterns = generateStemUrlPatterns(stemName, trackTitle);
    const baseUrls = [
      `${STRAPI_URL}/uploads/`,
      `${STRAPI_URL}/uploads/audio/`,
      `${STRAPI_URL}/uploads/stems/`,
    ];
    
    const urlsToTry = baseUrls.flatMap(base => 
      patterns.map(pattern => `${base}${pattern}`)
    );
    
    const validUrl = await findFirstValidUrl(urlsToTry);
    if (validUrl) {
      saveStemUrlToCache(trackTitle, stemName, validUrl);
      return validUrl;
    }
    
    // Last resort: use proxy fallback
    const proxyUrl = `/api/proxy/stem?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`;
    return proxyUrl;
  } catch (error) {
    console.error('Error finding stem URL:', error);
    return null;
  }
} 