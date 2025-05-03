/**
 * Utility functions to handle media URLs
 */

const CDN_DOMAIN = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'd1r94114aksajj.cloudfront.net';

/**
 * Converts a CloudFront URL to a proxied URL to avoid CORS issues
 * @param url The original URL (can be CloudFront or any other URL)
 * @returns The proxied URL
 */
export function getProxiedMediaUrl(url: string): string {
  // Skip if the URL is already relative or empty
  if (!url || url.startsWith('/') || url.startsWith('data:')) return url;
  
  // Check if URL is already proxied
  if (url.includes('/api/proxy/')) return url;
  
  // For S3/cloudfront URLs, use the direct-s3 API
  if (url.includes('cloudfront.net') || url.includes('s3.') || url.includes('/api/direct-s3/')) {
    // Extract the tracks/UUID part from the URL if possible
    const match = url.match(/tracks\/([^\/]+)\/([^\/]+)/);
    if (match) {
      const [, id, file] = match;
      return `/api/direct-s3/tracks/${id}/${file}`;
    }
    return url; // Keep as is if we can't parse it
  }
  
  // Otherwise use general proxy
  const encodedUrl = encodeURIComponent(url);
  return `/api/proxy?url=${encodedUrl}`;
}

/**
 * Checks if a URL is from CloudFront
 * @param url The URL to check
 * @returns True if the URL is from CloudFront
 */
export function isCloudFrontUrl(url: string): boolean {
  return !!url && (
    url.includes(CDN_DOMAIN) || 
    url.includes('cloudfront.net')
  );
}

/**
 * Get a signed URL for an S3 object
 * @param path The path to the S3 object
 * @returns Promise resolving to the signed URL
 */
export async function getSignedS3Url(path: string): Promise<string> {
  try {
    // Remove any leading slash
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    const response = await fetch('/api/s3-signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: cleanPath }),
    });
    
    if (!response.ok) {
      console.error('Failed to get signed URL:', await response.text());
      throw new Error('Failed to get signed URL');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}

/**
 * Extract the S3 object key from a CloudFront or proxied URL
 * @param url The URL to extract the key from
 * @returns The S3 object key or null if not found
 */
export function extractS3KeyFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Extract from CloudFront
  const cloudfrontMatch = url.match(/d1r9411aksajj\.cloudfront\.net\/(.+)/);
  if (cloudfrontMatch) return cloudfrontMatch[1];
  
  // Extract from direct S3URL
  const s3Match = url.match(/amazonaws\.com\/(.+)/);
  if (s3Match) return s3Match[1];
  
  return null;
}

/**
 * Generate a sanitized path segment from a track title
 * @param trackTitle The title of the track
 * @returns Sanitized path segment suitable for URLs
 */
export function sanitizePathSegment(trackTitle: string): string {
  // Sanitize track title for use in path: lowercase, replace spaces with hyphens, remove special chars
  return trackTitle
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Gets the appropriate cover image URL for a track based on available data
 * Handles all tracks consistently using their IDs
 * @param track The track object with id and possible imageUrl
 * @returns The most reliable image URL
 */
export function getTrackCoverImageUrl(track: { id?: string, imageUrl?: string, s3Path?: string }): string {
  // If track has an imageUrl, use it
  if (track.imageUrl && track.imageUrl.trim() !== '') {
    return track.imageUrl;
  }
  
  // If track has an id, use the direct-s3 API with ID-based path
  if (track.id) {
    return `/api/direct-s3/tracks/${track.id}/image?t=${Date.now()}`;
  }
  
  // If track has an s3Path, use it with dynamic path resolution
  if (track.s3Path) {
    return `/api/direct-s3/${track.s3Path}/image?t=${Date.now()}`;
  }
  
  // Return fallback image data URI for music icon
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l12-2v13'%3E%3C/path%3E%3Ccircle cx='6' cy='18' r='3'%3E%3C/circle%3E%3Ccircle cx='18' cy='16' r='3'%3E%3C/circle%3E%3C/svg%3E";
} 