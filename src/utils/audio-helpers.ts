import { STRAPI_URL } from '../config/strapi';
import { convertUrlToProxyUrl } from '../lib/audio';

/**
 * Generate a consistent stem URL format using the unified stem-audio endpoint
 * @param stemName - The name of the stem
 * @param trackTitle - The title of the track
 * @returns Formatted stem URL
 */
export function getConsistentStemUrl(stemName: string, trackTitle: string): string {
  return `/api/stem-audio?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`;
}

/**
 * Check if a URL exists (returns 200 OK)
 * @param url - The URL to check
 * @returns Whether the URL exists and is accessible
 */
export async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
  }
}

/**
 * Find the first valid URL from a list
 * @param urls - List of URLs to check
 * @returns The first valid URL or null if none are valid
 */
export async function findFirstValidUrl(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    console.log(`[URL CHECK] Testing URL: ${url}`);
    try {
      const isValid = await urlExists(url);
      if (isValid) {
        console.log(`[URL CHECK] ✅ URL is valid: ${url}`);
        return url;
      } else {
        console.log(`[URL CHECK] ❌ URL is invalid: ${url}`);
      }
    } catch (error) {
      console.error(`[URL CHECK] Error checking URL ${url}:`, error);
    }
  }
  console.log(`[URL CHECK] No valid URLs found from ${urls.length} candidates`);
  return null;
}

/**
 * Get a stem URL using the unified stem-audio endpoint
 * @param stemName - The name of the stem
 * @param trackTitle - The title of the track
 * @returns The URL to the stem audio
 */
export function getStemUrl(stemName: string, trackTitle: string): string {
  return getConsistentStemUrl(stemName, trackTitle);
} 