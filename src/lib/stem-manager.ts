import { STRAPI_URL } from '../services/strapi';

// Cache for storing discovered stem URLs to avoid repeated API calls
const stemUrlCache: Record<string, string> = {};

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

// Function to get the correct URL for a stem
export async function discoverStemUrl(stemName: string, trackTitle: string): Promise<string> {
  // Create a cache key combining track title and stem name
  const cacheKey = `${trackTitle}:${stemName}`;
  
  // Return cached URL if available
  if (stemUrlCache[cacheKey]) {
    return stemUrlCache[cacheKey];
  }
  
  try {
    // First, try the most reliable method: direct Strapi API query
    try {
      // Create multiple possible stem name variants to search for
      const stemVariants = [
        stemName,                                  // Exact stem name
        stemName.toLowerCase(),                    // Lowercase
        stemName.toUpperCase(),                    // Uppercase
        stemName.replace(/\s+/g, '_'),            // Replace spaces with underscores
        stemName.replace(/\s+/g, '-'),            // Replace spaces with hyphens
      ];
      
      // Create multiple possible track title variants
      const trackVariants = [
        trackTitle,                               // Exact track title
        trackTitle.toLowerCase(),                 // Lowercase
        trackTitle.replace(/\s+/g, '_'),          // Replace spaces with underscores
        trackTitle.replace(/\s+/g, '-'),          // Replace spaces with hyphens
      ];
      
      // Try all combinations of stem and track variants
      for (const stemVariant of stemVariants) {
        for (const trackVariant of trackVariants) {
          const searchPattern = `${stemVariant}_${trackVariant}`;
          const apiUrl = `${STRAPI_URL}/api/upload/files?filters[name][$contains]=${encodeURIComponent(searchPattern)}`;
          
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
              const url = `${STRAPI_URL}${data[0].url}`;
              saveStemUrlToCache(trackTitle, stemName, url);
              return url;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error querying Strapi API:', error);
    }
    
    // If Strapi API query fails, try fallback methods
    return getConsistentStemUrl(stemName, trackTitle);
  } catch (error) {
    console.error('Error discovering stem URL:', error);
    throw error;
  }
}

// Helper function to get a consistent stem URL
export function getConsistentStemUrl(stemName: string, trackTitle: string): string {
  const baseUrl = `${STRAPI_URL}/uploads`;
  const stemFileName = `${stemName}_${trackTitle.replace(/\s+/g, '_')}.mp3`;
  return `${baseUrl}/${stemFileName}`;
}

// Function to get stem URL with caching
export async function getStemUrl(stemName: string, trackTitle: string): Promise<string> {
  const cacheKey = `${trackTitle}:${stemName}`;
  
  // Return cached URL if available
  if (stemUrlCache[cacheKey]) {
    return stemUrlCache[cacheKey];
  }
  
  // Try to discover the URL
  try {
    const url = await discoverStemUrl(stemName, trackTitle);
    return url;
  } catch (error) {
    console.error('Error getting stem URL:', error);
    return getConsistentStemUrl(stemName, trackTitle);
  }
} 