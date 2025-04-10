/**
 * Clears all cached audio URLs from localStorage
 */
export function clearAudioCache(): void {
  const keys = [];
  // Find all localStorage keys related to audio caching
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('audio_url_') || key.startsWith('stem_url_'))) {
      keys.push(key);
    }
  }
  // Remove all found keys
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`Cleared ${keys.length} cached audio URLs from localStorage`);
}

/**
 * Invalidates cached audio URLs for a specific track
 * @param trackId The ID of the track to invalidate cache for
 */
export function invalidateTrackCache(trackId: string): void {
  const keys = [];
  // Find all localStorage keys related to this track
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes(trackId)) {
      keys.push(key);
    }
  }
  // Remove all found keys
  keys.forEach(key => localStorage.removeItem(key));
  console.log(`Invalidated ${keys.length} cached audio URLs for track ${trackId}`);
}

/**
 * Type definition for audio event types
 */
export type AudioEvents = 'play' | 'pause' | 'ended' | 'timeupdate' | 'error' | 'canplaythrough';

/**
 * Converts a Strapi media URL to a proxy URL to handle CORS issues
 * @param url - The URL to convert
 * @returns The converted URL (proxy URL) or the original if conversion fails
 */
export function convertUrlToProxyUrl(url: string): string {
  if (!url) return '';
  
  // If already a proxy URL, return as is
  if (url.startsWith('/api/proxy/')) {
    return url;
  }
  
  // Special case for direct access to uploads
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
      console.error(`[PROXY] Error converting URL ${url}:`, error);
    }
  }
  
  // If we couldn't process the URL through other methods, return it unchanged
  console.warn(`[PROXY] Could not convert URL to proxy format: ${url}`);
  return url;
}

/**
 * Creates an audio element with cross-origin settings and optional source
 * @param src - Optional source URL for the audio
 * @returns HTMLAudioElement with configured settings
 */
export function createAudio(src?: string): HTMLAudioElement {
  const audio = new Audio();
  audio.crossOrigin = "anonymous";
  
  if (src) {
    // Convert the URL to proxy URL if needed
    audio.src = convertUrlToProxyUrl(src);
  }
  
  return audio;
}

/**
 * Preloads an audio file and returns a promise
 * @param src - Source URL for the audio
 * @returns Promise that resolves with the audio element when loaded
 */
export function preloadAudio(src: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = createAudio(src);
    
    const handleCanPlay = () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('error', handleError);
      resolve(audio);
    };
    
    const handleError = () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('error', handleError);
      reject(new Error(`Failed to load audio: ${src}`));
    };
    
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('error', handleError);
    
    audio.load();
  });
} 