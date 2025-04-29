// Audio utility functions extracted from AudioPlayer.tsx
import { STRAPI_URL } from '../config/strapi';

// Format seconds into MM:SS format
export function formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Check if a URL exists by sending a HEAD request
export async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
  }
}

// Find the first valid URL from a list of potential URLs
export async function findFirstValidUrl(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    if (await urlExists(url)) {
      return url;
    }
  }
  return null;
}

// Create audio element with enhanced error handling
export function createAudio(src?: string): HTMLAudioElement {
  const audio = new Audio();
  audio.crossOrigin = "anonymous";
  
  if (src) {
    audio.src = src;
  }
  
  return audio;
}

// Load audio file and return promise
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

// Convert direct Strapi URL to proxy URL for better CORS handling
export function convertToProxyUrl(url: string): string {
  if (!url) return url;
  
  // If already a proxy URL, return as is
  if (url.startsWith('/api/proxy/')) {
    return url;
  }
  
  // Extract the part after uploads/
  const parts = url.split('/uploads/');
  if (parts.length > 1) {
    return `/api/proxy/uploads/${parts[1]}`;
  }
  
  return url;
} 