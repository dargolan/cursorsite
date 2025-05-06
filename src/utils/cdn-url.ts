/**
 * Constants for CDN and S3 domains
 */
const S3_DOMAIN = process.env.NEXT_PUBLIC_S3_DOMAIN || 'wave-cave-audio.s3.eu-north-1.amazonaws.com';
const CDN_DOMAIN = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'd1r94114aksajj.cloudfront.net';

/**
 * Gets the CDN domain from environment variables
 */
export function getCdnDomain(): string {
  return CDN_DOMAIN;
}

/**
 * Checks if a URL is already a CDN URL
 */
export function isCdnUrl(url: string): boolean {
  return url.includes(CDN_DOMAIN);
}

/**
 * Converts an S3 URL to its CDN equivalent
 * @param url The original URL (S3 or other)
 * @returns The CDN URL if the input was an S3 URL, otherwise the original URL
 */
export function toCdnUrl(url: string): string {
  if (!url) return '';
  if (isCdnUrl(url)) return url;
  if (url.includes(S3_DOMAIN)) {
    return url.replace(S3_DOMAIN, CDN_DOMAIN);
  }
  return url;
}

/**
 * Gets the S3 domain being used
 * @returns The S3 domain
 */
export function getS3Domain(): string {
  return S3_DOMAIN;
} 