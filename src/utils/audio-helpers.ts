import { STRAPI_URL, findStemFile } from '../services/strapi';
import { getStemUrlFromCache, saveStemUrlToCache, clearStemUrlCache } from './stem-cache';
import { convertUrlToProxyUrl } from '../lib/audio';

// Track-specific hash lookup tables (extracted from AudioPlayer.tsx)
const ELEVATOR_MUSIC_STEM_HASHES: Record<string, string> = {
  'Drums': '1c2ea5aba2',
  'Bass': '6cb3bdeb25',
  'Keys': '8b6f1b7eae',
  'FX': '0a83cd9fa7'
};

const CRAZY_MEME_MUSIC_STEM_HASHES: Record<string, string> = {
  'Drums': '5164139b81',
  'Bass': '56c32f2657',
  'Keys': 'f95c7fb9c5',
  'FX': '1a05f2b2cb'
};

const LOFI_BEATS_STEM_HASHES: Record<string, string> = {
  'Drums': '06c0ed1db9',
  'Bass': '1d5e66c5ad',
  'Keys': '31fd06f0c2',
  'FX': 'a8329e14bd'
};

const DRAMATIC_EPIC_CINEMA_STEM_HASHES: Record<string, string> = {
  'Drums': '2f7e6e7c86',
  'Bass': '3b9b32e6ed',
  'Strings': '55f7b7b9a7',
  'Drones': 'bb2b43af06'
};

// Initialize audio files array
let audioFiles: any[] = [];

// Function to fetch and update the audioFiles array from Strapi
export async function fetchAudioFiles(): Promise<any[]> {
  try {
    const apiUrl = `${STRAPI_URL}/api/upload/files`;
    console.log(`[AUDIO] Fetching audio files from ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio files: ${response.status}`);
    }
    
    const files = await response.json();
    
    // Filter to only audio files
    audioFiles = files.filter((file: any) => 
      file.mime && file.mime.toLowerCase().includes('audio')
    );
    
    console.log(`[AUDIO] Fetched ${audioFiles.length} audio files`);
    return audioFiles;
  } catch (error) {
    console.error(`[AUDIO] Error fetching audio files:`, error);
    return [];
  }
}

// Generate a consistent stem URL pattern
export function getConsistentStemUrl(stemName: string, trackTitle: string): string {
  // Normalize the stem name (first letter uppercase, rest lowercase)
  const normalizedStemName = stemName.charAt(0).toUpperCase() + stemName.slice(1).toLowerCase();
  
  // Normalize the track title (lowercase with underscores)
  const normalizedTrackTitle = trackTitle.toLowerCase().replace(/\s+/g, '_');
  
  // Construct the base URL pattern - NOTE: Without a hash, this won't work directly
  // We'll use this for API searching later
  return `${normalizedStemName}_${normalizedTrackTitle}`;
}

/**
 * Check if a filename matches a track based on track patterns
 * @param filename The filename to check
 * @param trackTitle The track title to match against
 * @returns Whether the filename matches the track
 */
export function filenameMatchesTrack(filename: string, trackTitle: string): boolean {
  if (!filename || !trackTitle) return false;
  
  // Normalize input
  const lowerFilename = filename.toLowerCase();
  const lowerTrackTitle = trackTitle.toLowerCase();
  
  // Check for direct match
  if (lowerFilename.includes(lowerTrackTitle.replace(/[\s-]+/g, '_'))) {
    console.log(`[MATCH] Direct match for ${trackTitle} in ${filename}`);
    return true;
  }
  
  // Check for semantic matches based on known track patterns
  const trackSpecificMatches = {
    'lo-fi beats': ['lo_fi_beat', 'lofi_beat', 'lo-fi'],
    'elevator music': ['elevator_music', 'elevator'],
    'crazy meme music': ['crazy_meme', 'meme_music'],
    'dramatic epic countdown': ['dramatic_countdown', 'dramatic_epic', 'countdown'],
    'long opener': ['long_opener', 'opener'],
    'transition music': ['transition_music', 'transition']
  };
  
  // Check if track title matches any of our known tracks
  for (const [knownTrack, patterns] of Object.entries(trackSpecificMatches)) {
    if (lowerTrackTitle.includes(knownTrack.toLowerCase())) {
      // If this is a known track, check if filename contains any of the expected patterns
      const matchesPattern = patterns.some(pattern => lowerFilename.includes(pattern));
      if (matchesPattern) {
        console.log(`[MATCH] Pattern match for ${trackTitle} using ${patterns.join(', ')} in ${filename}`);
        return true;
      }
      
      // If we determined this is a known track but didn't match patterns,
      // we should return false to prevent incorrect matches
      console.log(`[MISMATCH] Known track ${trackTitle} but filename ${filename} doesn't match expected patterns`);
      return false;
    }
  }
  
  // Check if any significant word from the track title appears in the filename
  // (only for tracks not covered by the specific patterns above)
  const significantWords = lowerTrackTitle.split(/[\s-]+/).filter(word => word.length > 3);
  const matchesSignificantWord = significantWords.some(word => 
    lowerFilename.includes(word.replace(/[^a-z0-9]/g, '_'))
  );
  
  if (matchesSignificantWord) {
    console.log(`[MATCH] Word match for ${trackTitle} in ${filename}`);
    return true;
  }
  
  // No match found
  console.log(`[MISMATCH] No match for ${trackTitle} in ${filename}`);
  return false;
}

// Function to check if a URL exists (returns 200 OK)
export async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
  }
}

// Function to find the first valid URL from a list
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

// Ensure audio files are loaded before trying to use them
export async function ensureAudioFiles(): Promise<boolean> {
  if (audioFiles.length === 0) {
    try {
      const files = await fetchAudioFiles();
      return files.length > 0;
    } catch (error) {
      console.error('[AUDIO] Failed to load audio files:', error);
      return false;
    }
  }
  return true;
}

export const findStemFileUrl = async (
  stemName: string,
  trackTitle: string,
  trackId: string,
  debugLevel = 0
): Promise<string | null> => {
  // Check if we have a cached URL for this stem
  const cachedUrl = getStemUrlFromCache(trackId, trackTitle, stemName);
  
  // If we have a cached URL and it exists, return it
  if (cachedUrl) {
    if (debugLevel > 0) {
      console.log(`[findStemFileUrl] Using cached URL for ${stemName} (${trackTitle}): ${cachedUrl}`);
    }
    
    // Verify that the URL is still valid
    const isUrlValid = await urlExists(cachedUrl);
    if (isUrlValid) {
      return cachedUrl;
    } else {
      console.warn(`[findStemFileUrl] Cached URL for ${stemName} (${trackTitle}) is no longer valid. Removing from cache.`);
      clearStemUrlCache(trackId, trackTitle, stemName);
    }
  }

  // Ensure we have audio files loaded
  const hasAudioFiles = await ensureAudioFiles();
  if (!hasAudioFiles) {
    console.error(`[findStemFileUrl] Could not load audio files`);
    return null;
  }

  if (!trackTitle || !stemName) {
    console.error(`[findStemFileUrl] Invalid input: trackTitle=${trackTitle}, stemName=${stemName}`);
    return null;
  }

  console.log(`[findStemFileUrl] Searching for ${stemName} for track: "${trackTitle}" (ID: ${trackId})`);
  console.log(`[findStemFileUrl] Available audio files: ${audioFiles.length}`);

  // Try hash-based URLs first (based on track type)
  let proxyUrl = null;
  const trackLower = trackTitle.toLowerCase();
  
  // For existing tracks that use the old hash-based system, maintain compatibility
  if (trackLower.includes('elevator music') && ELEVATOR_MUSIC_STEM_HASHES[stemName]) {
    proxyUrl = convertUrlToProxyUrl(`${STRAPI_URL}/uploads/${stemName}_Elevator_music_${ELEVATOR_MUSIC_STEM_HASHES[stemName]}.mp3`);
    console.log(`[findStemFileUrl] Generated proxy URL for Elevator Music: ${proxyUrl}`);
  }
  else if (trackLower.includes('crazy meme') && CRAZY_MEME_MUSIC_STEM_HASHES[stemName]) {
    proxyUrl = convertUrlToProxyUrl(`${STRAPI_URL}/uploads/${stemName}_Crazy_meme_music_${CRAZY_MEME_MUSIC_STEM_HASHES[stemName]}.mp3`);
    console.log(`[findStemFileUrl] Generated proxy URL for Crazy Meme Music: ${proxyUrl}`);
  }
  else if ((trackLower.includes('lo-fi beat') || trackLower.includes('lo-fi beats')) && LOFI_BEATS_STEM_HASHES[stemName]) {
    proxyUrl = convertUrlToProxyUrl(`${STRAPI_URL}/uploads/${stemName}_Lo_Fi_Beat_${LOFI_BEATS_STEM_HASHES[stemName]}.mp3`);
    console.log(`[findStemFileUrl] Generated proxy URL for Lo-Fi Beats: ${proxyUrl}`);
  }
  else if ((trackLower.includes('dramatic countdown') || trackLower.includes('dramatic epic')) && DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]) {
    proxyUrl = convertUrlToProxyUrl(`${STRAPI_URL}/uploads/${stemName}_Dramatic_Countdown_${DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]}.mp3`);
    console.log(`[findStemFileUrl] Generated proxy URL for Dramatic Epic: ${proxyUrl}`);
  }
  
  // If we have a proxy URL from hash tables, check if it's valid
  if (proxyUrl) {
    const isValid = await urlExists(proxyUrl);
    if (isValid) {
      console.log(`[findStemFileUrl] Hash-based URL is valid: ${proxyUrl}`);
      // Save to cache for future use
      saveStemUrlToCache(trackId, trackTitle, stemName, proxyUrl);
      return proxyUrl;
    } else {
      console.log(`[findStemFileUrl] Hash-based URL failed validation: ${proxyUrl}`);
    }
  }

  // Normalize names for comparison
  const normalizedStemName = stemName.toLowerCase().trim();
  const normalizedTrackTitle = trackTitle.toLowerCase().trim();
  
  // Filter possible stem files by MIME type (audio) and name patterns
  const possibleStemFiles = audioFiles.filter((file: any) => {
    const isAudio = file.mime?.toLowerCase().includes('audio');
    if (!isAudio) return false;
    
    const filename = file.name?.toLowerCase() || '';
    const stemMatch = filename.includes(normalizedStemName.replace(/\s+/g, '_')) || 
                     filename.includes(normalizedStemName.replace(/\s+/g, '-')) ||
                     filename.includes(normalizedStemName) ||
                     normalizedStemName === 'all instruments' && filename.includes('all_instruments');
                     
    // If there's no stem match, don't consider this file
    if (!stemMatch) return false;
    
    // Check if the file belongs to the correct track
    return filenameMatchesTrack(filename, trackTitle);
  });

  console.log(`[findStemFileUrl] Found ${possibleStemFiles.length} possible stem files for ${stemName} (${trackTitle})`);
  
  // If no potential matches found, log and return null
  if (possibleStemFiles.length === 0) {
    console.log(`[findStemFileUrl] No matches found for ${stemName} (${trackTitle})`);
    return null;
  }
  
  // Debugging: Log all found possibilities
  possibleStemFiles.forEach((file: any) => {
    console.log(`[findStemFileUrl] Possible match: ${file.name} (${file.url})`);
  });
  
  // Pick the first match - assuming it's the correct one after our filtering
  const stemFile = possibleStemFiles[0];
  
  // Double-check filename to ensure it belongs to the correct track
  const filename = stemFile.name?.toLowerCase() || '';
  const isCorrectTrack = filenameMatchesTrack(filename, trackTitle);
  
  if (!isCorrectTrack) {
    console.warn(`[findStemFileUrl] WARNING: Selected file ${filename} may not belong to track ${trackTitle}`);
    return null;
  }
  
  if (stemFile) {
    console.log(`[findStemFileUrl] Found stem file: ${stemFile.name} for ${stemName} (${trackTitle})`);
    // Get the full URL or path to the audio file
    let stemUrl = stemFile.url?.startsWith('http') 
      ? stemFile.url 
      : `${STRAPI_URL}${stemFile.url}`;
    
    // Convert to proxy URL for better CORS handling
    stemUrl = convertUrlToProxyUrl(stemUrl);
    console.log(`[findStemFileUrl] Using proxy URL: ${stemUrl}`);
      
    // Cache this URL for future use
    saveStemUrlToCache(trackId, trackTitle, stemName, stemUrl);
    return stemUrl;
  }

  console.log(`[findStemFileUrl] No stem file found for ${stemName} (${trackTitle})`);
  return null;
}

// Function to get the correct URL for a stem - returns a string directly
export function getStemUrl(stemName: string, trackTitle: string): string {
  let url;
  
  // For existing tracks that use the old hash-based system, maintain compatibility
  const trackLower = trackTitle.toLowerCase();
  if (trackLower === 'elevator music' && ELEVATOR_MUSIC_STEM_HASHES[stemName]) {
    url = `${STRAPI_URL}/uploads/${stemName}_Elevator_music_${ELEVATOR_MUSIC_STEM_HASHES[stemName]}.mp3`;
  }
  else if (trackLower === 'crazy meme music' && CRAZY_MEME_MUSIC_STEM_HASHES[stemName]) {
    url = `${STRAPI_URL}/uploads/${stemName}_Crazy_meme_music_${CRAZY_MEME_MUSIC_STEM_HASHES[stemName]}.mp3`;
  }
  else if ((trackLower === 'lo-fi beat' || trackLower === 'lo-fi beats') && LOFI_BEATS_STEM_HASHES[stemName]) {
    url = `${STRAPI_URL}/uploads/${stemName}_Lo_Fi_Beat_${LOFI_BEATS_STEM_HASHES[stemName]}.mp3`;
  }
  else if ((trackLower === 'dramatic countdown' || trackLower === 'dramatic epic cinema' || trackLower === 'dramatic epic countdown') && DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]) {
    url = `${STRAPI_URL}/uploads/${stemName}_Dramatic_Countdown_${DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]}.mp3`;
  }
  else {
    // For other tracks, use a format that's likely to work
    const normalizedStemName = stemName.charAt(0).toUpperCase() + stemName.slice(1).toLowerCase();
    const normalizedTrackTitle = trackTitle
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('_');
  
    // Use a more specific pattern that matches what we see in the proxy logs
    url = `${STRAPI_URL}/uploads/${normalizedStemName}_${normalizedTrackTitle}_placeholder.mp3`;
  }
  
  // Always convert to proxy URL
  return convertUrlToProxyUrl(url);
} 