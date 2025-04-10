import { clearAllStemUrlCaches, initStemUrlCache } from './stem-cache';

/**
 * Utility function to display the current state of the stem cache
 * @returns Object containing the current stem cache entries
 */
export function inspectStemCache(): Record<string, string> {
  try {
    const cacheData = localStorage.getItem('stemUrlCache');
    if (!cacheData) {
      console.log('[DEBUG] Stem cache is empty');
      return {};
    }
    
    const cache = JSON.parse(cacheData);
    
    // Log each entry for debugging
    console.log('[DEBUG] Current stem cache entries:');
    Object.entries(cache).forEach(([key, url]) => {
      const [trackId, trackTitle, stemName] = key.split(':');
      console.log(`- ${stemName} (${trackTitle}): ${url}`);
    });
    
    return cache;
  } catch (e) {
    console.error('[DEBUG] Error inspecting stem cache:', e);
    return {};
  }
}

/**
 * Reset the stem cache completely and reinitialize
 */
export function resetStemCache(): void {
  console.log('[DEBUG] Resetting stem cache...');
  
  try {
    // Clear all caches first
    clearAllStemUrlCaches();
    
    // Then reinitialize
    initStemUrlCache();
    
    console.log('[DEBUG] Stem cache has been reset and reinitialized');
  } catch (e) {
    console.error('[DEBUG] Error resetting stem cache:', e);
  }
}

/**
 * Perform a comprehensive debug of audio loading issues
 * @param trackTitle - The track title with issues
 * @param stemName - The stem name with issues
 */
export function debugAudioLoading(trackTitle: string, stemName: string): void {
  console.log(`[DEBUG] Starting audio debug for ${stemName} in "${trackTitle}"`);
  
  // Check cache entries
  const cache = inspectStemCache();
  
  // Look for entries that might be related to this track/stem
  const relevantEntries = Object.entries(cache).filter(([key]) => {
    return key.includes(trackTitle) || key.includes(stemName);
  });
  
  console.log(`[DEBUG] Found ${relevantEntries.length} potentially relevant cache entries`);
  
  // Check localStorage for other items that might be interfering
  console.log('[DEBUG] All localStorage keys:');
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`- ${key}`);
    }
  } catch (e) {
    console.error('[DEBUG] Error listing localStorage keys:', e);
  }
}

/**
 * Check if a URL exists and is accessible
 * @param url - The URL to check
 * @returns Promise resolving to true if the URL exists and is accessible
 */
export async function testUrlAccess(url: string): Promise<boolean> {
  console.log(`[DEBUG] Testing URL access: ${url}`);
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    console.log(`[DEBUG] URL ${url} status: ${response.status}`);
    return response.ok;
  } catch (e) {
    console.error(`[DEBUG] URL ${url} is not accessible:`, e);
    return false;
  }
} 

/**
 * Utility function to display the current state of the stem cache
 * @returns Object containing the current stem cache entries
 */
export function inspectStemCache(): Record<string, string> {
  try {
    const cacheData = localStorage.getItem('stemUrlCache');
    if (!cacheData) {
      console.log('[DEBUG] Stem cache is empty');
      return {};
    }
    
    const cache = JSON.parse(cacheData);
    
    // Log each entry for debugging
    console.log('[DEBUG] Current stem cache entries:');
    Object.entries(cache).forEach(([key, url]) => {
      const [trackId, trackTitle, stemName] = key.split(':');
      console.log(`- ${stemName} (${trackTitle}): ${url}`);
    });
    
    return cache;
  } catch (e) {
    console.error('[DEBUG] Error inspecting stem cache:', e);
    return {};
  }
}

/**
 * Reset the stem cache completely and reinitialize
 */
export function resetStemCache(): void {
  console.log('[DEBUG] Resetting stem cache...');
  
  try {
    // Clear all caches first
    clearAllStemUrlCaches();
    
    // Then reinitialize
    initStemUrlCache();
    
    console.log('[DEBUG] Stem cache has been reset and reinitialized');
  } catch (e) {
    console.error('[DEBUG] Error resetting stem cache:', e);
  }
}

/**
 * Perform a comprehensive debug of audio loading issues
 * @param trackTitle - The track title with issues
 * @param stemName - The stem name with issues
 */
export function debugAudioLoading(trackTitle: string, stemName: string): void {
  console.log(`[DEBUG] Starting audio debug for ${stemName} in "${trackTitle}"`);
  
  // Check cache entries
  const cache = inspectStemCache();
  
  // Look for entries that might be related to this track/stem
  const relevantEntries = Object.entries(cache).filter(([key]) => {
    return key.includes(trackTitle) || key.includes(stemName);
  });
  
  console.log(`[DEBUG] Found ${relevantEntries.length} potentially relevant cache entries`);
  
  // Check localStorage for other items that might be interfering
  console.log('[DEBUG] All localStorage keys:');
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`- ${key}`);
    }
  } catch (e) {
    console.error('[DEBUG] Error listing localStorage keys:', e);
  }
}

/**
 * Check if a URL exists and is accessible
 * @param url - The URL to check
 * @returns Promise resolving to true if the URL exists and is accessible
 */
export async function testUrlAccess(url: string): Promise<boolean> {
  console.log(`[DEBUG] Testing URL access: ${url}`);
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    console.log(`[DEBUG] URL ${url} status: ${response.status}`);
    return response.ok;
  } catch (e) {
    console.error(`[DEBUG] URL ${url} is not accessible:`, e);
    return false;
  }
} 