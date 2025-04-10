import { STRAPI_URL, findStemFile } from '../services/strapi';

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

// Function to search for a stem file through the Strapi API
export async function findStemFileUrl(stemName: string, trackTitle: string): Promise<string | null> {
  try {
    console.log(`Looking for stem "${stemName}" in track "${trackTitle}"`);
    
    // First try to use the utility function from strapi.ts that was made for this purpose
    // This now uses a more reliable method that fetches stems directly from their parent track
    const strapiStemUrl = await findStemFile(stemName, trackTitle);
    if (strapiStemUrl) {
      console.log(`✅ Found stem URL via strapi.ts: ${strapiStemUrl}`);
      return strapiStemUrl;
    }
    
    // If no URL was found through the track relationship, try different approaches
    console.log(`⚠️ Trying alternative approaches for stem "${stemName}" in "${trackTitle}"`);
    
    // Use hash-based approach for known tracks
    const trackLower = trackTitle.toLowerCase();
    
    // Handle special case for Lo-Fi Beats
    if ((trackLower === 'lo-fi beat' || trackLower === 'lo-fi beats') && LOFI_BEATS_STEM_HASHES[stemName]) {
      const url = `${STRAPI_URL}/uploads/${stemName}_Lo_Fi_Beat_${LOFI_BEATS_STEM_HASHES[stemName]}.mp3`;
      console.log(`🔍 Using hash-based URL for Lo-Fi Beats: ${url}`);
      return url;
    }
    
    // Handle special case for Elevator Music
    if (trackLower === 'elevator music' && ELEVATOR_MUSIC_STEM_HASHES[stemName]) {
      const url = `${STRAPI_URL}/uploads/${stemName}_Elevator_music_${ELEVATOR_MUSIC_STEM_HASHES[stemName]}.mp3`;
      console.log(`🔍 Using hash-based URL for Elevator Music: ${url}`);
      return url;
    }
    
    // Handle special case for Crazy Meme Music
    if (trackLower === 'crazy meme music' && CRAZY_MEME_MUSIC_STEM_HASHES[stemName]) {
      const url = `${STRAPI_URL}/uploads/${stemName}_Crazy_meme_music_${CRAZY_MEME_MUSIC_STEM_HASHES[stemName]}.mp3`;
      console.log(`🔍 Using hash-based URL for Crazy Meme Music: ${url}`);
      return url;
    }
    
    // Handle special case for Dramatic Epic Cinema
    if ((trackLower.includes('dramatic') && (trackLower.includes('epic') || trackLower.includes('countdown'))) && 
        DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]) {
      const url = `${STRAPI_URL}/uploads/${stemName}_Dramatic_Countdown_${DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]}.mp3`;
      console.log(`🔍 Using hash-based URL for Dramatic Epic: ${url}`);
      return url;
    }
    
    // If we don't have a hash-based approach, try the API search
    const basePattern = getConsistentStemUrl(stemName, trackTitle);
    const apiUrl = `${STRAPI_URL}/api/upload/files?filters[name][$contains]=${encodeURIComponent(basePattern)}`;
    
    console.log(`🌐 Searching Strapi API for ${basePattern}`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const files = await response.json();
    if (files && files.length > 0) {
      console.log(`Found ${files.length} possible files`);
      
      // Sort to find the most relevant match
      const sortedFiles = [...files].sort((a, b) => {
        // Prioritize files that match our pattern exactly (may have different hash)
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Check for exact stem name at start
        const stemPattern = new RegExp(`^${stemName.toLowerCase()}_`, 'i');
        const aHasStemPrefix = stemPattern.test(aName);
        const bHasStemPrefix = stemPattern.test(bName);
        
        if (aHasStemPrefix && !bHasStemPrefix) return -1;
        if (!aHasStemPrefix && bHasStemPrefix) return 1;
        
        // Check for track title
        const trackPattern = trackTitle.toLowerCase().replace(/\s+/g, '_');
        const aHasTrack = aName.includes(trackPattern);
        const bHasTrack = bName.includes(trackPattern);
        
        if (aHasTrack && !bHasTrack) return -1;
        if (!aHasTrack && bHasTrack) return 1;
        
        // Otherwise sort by recency (newer files first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      const bestMatch = sortedFiles[0];
      const url = bestMatch.url.startsWith('/') 
        ? `${STRAPI_URL}${bestMatch.url}` 
        : `${STRAPI_URL}/${bestMatch.url}`;
      
      console.log(`📁 Found best match by API search: ${bestMatch.name} -> ${url}`);
      return url;
    }
    
    console.log(`❌ All approaches failed for stem "${stemName}" in track "${trackTitle}"`);
    return null;
  } catch (error) {
    console.error(`Error searching for stem file: ${error}`);
    return null;
  }
}

// Function to get the correct URL for a stem - returns a string directly
export function getStemUrl(stemName: string, trackTitle: string): string {
  // For existing tracks that use the old hash-based system, maintain compatibility
  const trackLower = trackTitle.toLowerCase();
  if (trackLower === 'elevator music' && ELEVATOR_MUSIC_STEM_HASHES[stemName]) {
    const url = `${STRAPI_URL}/uploads/${stemName}_Elevator_music_${ELEVATOR_MUSIC_STEM_HASHES[stemName]}.mp3`;
    return url;
  }
  if (trackLower === 'crazy meme music' && CRAZY_MEME_MUSIC_STEM_HASHES[stemName]) {
    const url = `${STRAPI_URL}/uploads/${stemName}_Crazy_meme_music_${CRAZY_MEME_MUSIC_STEM_HASHES[stemName]}.mp3`;
    return url;
  }
  if ((trackLower === 'lo-fi beat' || trackLower === 'lo-fi beats') && LOFI_BEATS_STEM_HASHES[stemName]) {
    const url = `${STRAPI_URL}/uploads/${stemName}_Lo_Fi_Beat_${LOFI_BEATS_STEM_HASHES[stemName]}.mp3`;
    return url;
  }
  if ((trackLower === 'dramatic countdown' || trackLower === 'dramatic epic cinema' || trackLower === 'dramatic epic countdown') && DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]) {
    const url = `${STRAPI_URL}/uploads/${stemName}_Dramatic_Countdown_${DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]}.mp3`;
    return url;
  }
  
  // For immediate return, we'll use a pattern-based URL as a best guess
  // Normalize the stem name and track title
  const normalizedStemName = stemName.charAt(0).toUpperCase() + stemName.slice(1).toLowerCase();
  const normalizedTrackTitle = trackTitle.split(' ')
    .map((word, index) => word.toLowerCase())
    .join('_');
  
  // Use a placeholder hash that will be replaced when the real one is found
  const placeholderHash = 'placeholder';
  const url = `${STRAPI_URL}/uploads/${normalizedStemName}_${normalizedTrackTitle}_${placeholderHash}.mp3`;
  
  return url;
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
    if (await urlExists(url)) {
      return url;
    }
  }
  return null;
} 