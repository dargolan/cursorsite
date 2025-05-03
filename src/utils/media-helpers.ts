/**
 * Utilities for handling media URLs and proxying to avoid CORS issues
 */

import { STRAPI_URL } from '../config/strapi';

/**
 * Converts a media URL to a proxied version to avoid CORS issues
 * @param url The original media URL
 * @returns The proxied URL for CORS-free access
 */
export function getProxiedMediaUrl(url: string): string {
  if (!url) return '';
  
  // If already a proxy URL, return as is
  if (url.startsWith('/api/proxy/') || url.startsWith('/api/proxy-media')) {
    return url;
  }

  // If it's a direct-s3 URL, keep it as is (already handled internally)
  if (url.startsWith('/api/direct-s3/')) {
    return url;
  }
  
  // Handle URLs with /uploads/ path
  if (url.includes('/uploads/')) {
    try {
      // For fully qualified URLs
      if (url.startsWith('http')) {
        // Extract just the filename part after /uploads/
        const uploadsPath = url.split('/uploads/')[1];
        return `/api/proxy/uploads/${uploadsPath}`;
      } 
      // For relative URLs starting with /uploads/
      else if (url.startsWith('/uploads/')) {
        const path = url.substring(1); // remove leading slash
        return `/api/proxy/${path}`;
      }
    } catch (error) {
      console.error(`[getProxiedMediaUrl] Error converting URL ${url}:`, error);
    }
  }
  
  // Special case for relative paths that need to be prefixed with STRAPI_URL
  if (url.startsWith('/') && !url.startsWith('/api/')) {
    const fullUrl = `${STRAPI_URL}${url}`;
    return `/api/proxy-media?url=${encodeURIComponent(fullUrl)}`;
  }
  
  // For absolute URLs that aren't already handled
  if (url.startsWith('http')) {
    return `/api/proxy-media?url=${encodeURIComponent(url)}`;
  }
  
  // If we couldn't process the URL through other methods, return it unchanged
  console.warn(`[getProxiedMediaUrl] Could not convert URL to proxy format: ${url}`);
  return url;
}

/**
 * Utility function to check if a URL is relative
 * @param url URL to check
 * @returns boolean indicating if the URL is relative
 */
export function isRelativeUrl(url: string): boolean {
  return Boolean(url) && !url.startsWith('http') && !url.startsWith('//');
}

/**
 * Converts a relative URL to an absolute URL using the STRAPI_URL as base
 * @param url Relative URL
 * @returns Absolute URL
 */
export function getAbsoluteUrl(url: string): string {
  if (!url) return '';
  if (!isRelativeUrl(url)) return url;
  
  // If it starts with a slash, make sure we don't double up slashes
  if (url.startsWith('/')) {
    const baseUrl = STRAPI_URL.endsWith('/') ? STRAPI_URL.slice(0, -1) : STRAPI_URL;
    return `${baseUrl}${url}`;
  }
  
  // Otherwise add a slash between the base URL and the relative path
  const baseUrl = STRAPI_URL.endsWith('/') ? STRAPI_URL : `${STRAPI_URL}/`;
  return `${baseUrl}${url}`;
} 

/**
 * Gets the cover image URL for a track
 * @param track The track object with id and optional imageUrl
 * @returns The image URL to use for the track cover
 */
export function getTrackCoverImageUrl(track: { id?: string, imageUrl?: string }): string {
  // If track has an imageUrl, use it
  if (track.imageUrl && track.imageUrl.trim() !== '') {
    // Ensure the URL is properly proxied
    return getProxiedMediaUrl(track.imageUrl);
  }
  
  // If we have no image URL, this is an error case
  console.error(`[getTrackCoverImageUrl] No image URL available for track: ${track.id}`);
  return '';
} 