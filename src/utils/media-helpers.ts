/**
 * Utilities for handling media URLs and proxying to avoid CORS issues
 */

import { STRAPI_URL } from '../config/strapi';
import { toCdnUrl } from './cdn-url';

/**
 * Converts a media URL to a proxied version to avoid CORS issues
 * @param url The original media URL
 * @returns The proxied URL for CORS-free access
 */
export function getProxiedMediaUrl(url: string): string {
  if (!url) return '';
  // Convert S3 URLs to CDN URLs
  const cdnUrl = toCdnUrl(url);
  // If the URL is already absolute (http/https), return as is
  if (/^https?:\/\//.test(cdnUrl)) return cdnUrl;
  // Otherwise, return as is (or add proxy logic if needed for local dev)
  return cdnUrl;
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
export function getTrackCoverImageUrl(track: { id?: string, imageUrl?: string, image?: { url?: string } }): string {
  // Use Strapi-provided imageUrl or nested image.url
  const url = track.imageUrl || (track.image && track.image.url) || '';
  if (url && url.trim() !== '') {
    return toCdnUrl(url);
  }
  // If we have no image URL, this is an error case
  console.error(`[getTrackCoverImageUrl] No image URL available for track: ${track.id}`);
  return '';
} 