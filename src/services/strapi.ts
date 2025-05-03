import { Track, Tag, Stem } from '../types';
import { STRAPI_URL, API_URL, API_TOKEN } from '../config/strapi';
import { getProxiedMediaUrl } from '../utils/media-helpers';

// Debug info for environment setup (only log once)
if (typeof window !== 'undefined') {
  console.log('=== Strapi Configuration ===\n', {
    STRAPI_URL,
    API_URL,
    hasToken: !!API_TOKEN
  });
}

// Re-export these for components that need them
export { STRAPI_URL, API_URL, API_TOKEN };

/**
 * Get the Strapi media URL
 * @returns The base URL for Strapi media files
 */
export function getStrapiMediaUrl(): string {
  return STRAPI_URL;
}

// Helper function to get headers
export function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  return headers;
}

// Get request options for fetch calls
export function getRequestOptions(): RequestInit {
  return {
    headers: getHeaders(),
    mode: 'cors',
    cache: 'no-store',
    credentials: 'omit'
  };
}

// Helper to format the image URL
export function getStrapiMedia(url: string | null) {
  if (!url) return null;
  // Return the full URL if it's already absolute
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}

// Normalize Strapi response format to our frontend types
export function normalizeTrack(strapiTrack: any): Track {
  try {
    // Extract data from attributes if present
    const data = strapiTrack.attributes || strapiTrack;
    
    // Ensure we have a valid track ID
    const trackId = strapiTrack.id?.toString() || '';
    if (!trackId) {
      console.error('[normalizeTrack] Missing track ID in Strapi response:', strapiTrack);
    }
    
    // Get track title for path generation
    const trackTitle = data.title || data.Title || 'Unknown Track';
    
    // Get the actual URLs directly from Strapi
    let audioUrl = data.audioUrl || '';
    let imageUrl = data.imageUrl || data.ImageUrl || '';
    
    // Process tags from Strapi response
    let tags: Tag[] = [];
    
    // Add debug logging to see the exact structure of the tags
    console.log(`[normalizeTrack] Raw tag data for track "${trackTitle}":`, {
      hasTagsProperty: !!data.tags,
      tagsType: data.tags ? typeof data.tags : 'undefined',
      isTagsArray: data.tags && Array.isArray(data.tags),
      tagsLength: data.tags && Array.isArray(data.tags) ? data.tags.length : 0,
      firstTag: data.tags && Array.isArray(data.tags) && data.tags.length > 0 ? 
        JSON.stringify(data.tags[0]) : 'No tags'
    });
    
    if (data.tags && Array.isArray(data.tags)) {
      // Direct array of tags with capitalized property names (Name, Type)
      tags = data.tags.map((tag: any) => ({
        id: tag.id.toString(),
        name: tag.Name || tag.name || 'Unknown Tag', // Note: API returns "Name" not "name"
        type: tag.type || 'genre' // The "type" property is lowercase
      }));
      
      console.log(`[normalizeTrack] Processed ${tags.length} tags for "${trackTitle}":`, 
        tags.map(t => `${t.name} (${t.type})`));
    } else {
      console.warn(`[normalizeTrack] No tags found for "${trackTitle}"`);
    }
    
    // Process stems directly from Strapi data
    const stems = data.stems?.data?.map((stem: any) => {
      const stemData = stem.attributes || stem;
      return {
        id: stem.id.toString(),
        name: stemData?.name || 'Unknown Stem',
        url: getProxiedMediaUrl(stemData?.url || ''),
        price: Number(stemData?.price) || 0,
        duration: Number(stemData?.duration) || 0
      };
    }) || [];
    
    return {
      id: trackId,
      title: trackTitle,
      bpm: Number(data.bpm || data.BPM) || 0,
      duration: Number(data.duration || data.Duration) || 0,
      tags: tags,
      stems: stems,
      hasStems: stems.length > 0,
      audioUrl: getProxiedMediaUrl(audioUrl),
      imageUrl: getProxiedMediaUrl(imageUrl),
      waveform: data.waveform || []
    };
  } catch (error) {
    console.error('Error normalizing track:', error);
    return {
      id: strapiTrack?.id?.toString() || 'error',
      title: 'Error Loading Track',
      bpm: 0,
      duration: 0,
      tags: [],
      stems: [],
      audioUrl: '',
      imageUrl: '',
      hasStems: false,
      waveform: []
    };
  }
}

// Get all tags from Strapi
export async function getTags(): Promise<Tag[]> {
  try {
    console.log('[getTags] Fetching tags from Strapi API');
    const response = await fetch(`${API_URL}/tags?populate=*&pagination[pageSize]=100`, getRequestOptions());

    if (!response.ok) {
      console.error(`[getTags] Error fetching tags: ${response.status}`);
      const errorText = await response.text();
      console.error(`[getTags] Error response: ${errorText}`);
      throw new Error(`Error fetching tags: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) {
      console.error('[getTags] Invalid or empty data returned from Strapi:', data);
      return [];
    }

    console.log(`[getTags] Successfully retrieved ${data.data.length} tags from Strapi`);
    
    const tags = data.data.map((item: any) => ({
      id: item.id.toString(),
      name: item.attributes?.name || item.attributes?.Name || item.name || item.Name || 'Unknown Tag',
      type: item.attributes?.type || item.attributes?.Type || item.type || item.Type || 'genre',
      count: 0
    }));
    
    // Log tag categories for debugging
    const genres = tags.filter((tag: Tag) => tag.type === 'genre');
    const moods = tags.filter((tag: Tag) => tag.type === 'mood');
    const instruments = tags.filter((tag: Tag) => tag.type === 'instrument');
    
    console.log(`[getTags] Tag breakdown - Genres: ${genres.length}, Moods: ${moods.length}, Instruments: ${instruments.length}`);
    
    return tags;
  } catch (error) {
    console.error('Error in getTags:', error);
    return [];
  }
}

// Get all tracks from Strapi
export async function getTracks(): Promise<Track[]> {
  try {
    console.log('[getTracks] Fetching tracks from Strapi API:', `${API_URL}/tracks?populate=*`);
    
    const response = await fetch(`${API_URL}/tracks?populate=*`, getRequestOptions());

    if (!response.ok) {
      console.error(`[getTracks] Error fetching tracks: ${response.status}`);
      throw new Error(`Error fetching tracks: ${response.status}`);
    }

    const data = await response.json();
    
    // Add debugging for the API response
    console.log('[getTracks] API Response structure:', JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    console.log('[getTracks] First track tags data:', data.data && data.data[0] ? 
      JSON.stringify(data.data[0].attributes?.tags || 'No tags found in first track') : 'No tracks found');

    if (!data?.data || !Array.isArray(data.data)) {
      console.error('[getTracks] Invalid or empty data returned from Strapi:', data);
      return [];
    }

    console.log(`[getTracks] Retrieved ${data.data.length} tracks from Strapi`);
    
    // Validate each track has an ID before normalization
    const tracksWithIds = data.data.filter((item: any) => {
      if (!item.id) {
        console.error('[getTracks] Found track without ID:', item);
        return false;
      }
      return true;
    });
    
    if (tracksWithIds.length !== data.data.length) {
      console.warn(`[getTracks] Filtered out ${data.data.length - tracksWithIds.length} tracks missing IDs`);
    }

    // Normalize tracks with proper error handling
    const normalizedTracks = tracksWithIds
      .map((item: any) => {
      try {
        const track = normalizeTrack(item);
          // Double-check that track has an ID after normalization
          if (!track.id) {
            console.error('[getTracks] Track missing ID after normalization:', item);
            return null;
          }
        return track;
      } catch (e) {
          console.error('[getTracks] Error processing track:', e, item);
        return null;
      }
      })
      .filter(Boolean);
    
    console.log(`[getTracks] Successfully normalized ${normalizedTracks.length} tracks`);

    return normalizedTracks;
  } catch (error) {
    console.error('[getTracks] Error fetching tracks:', error);
    return [];
  }
}

// Get a single track by ID
export async function getTrack(id: string): Promise<Track | null> {
  try {
    if (!id) {
      console.error('[getTrack] Called with empty ID');
      return null;
    }
    
    console.log(`[getTrack] Fetching track with ID: ${id}`);
    
    const response = await fetch(`${API_URL}/tracks/${id}?populate=*`, getRequestOptions());

    if (!response.ok) {
      console.error(`[getTrack] Error fetching track: ${response.status}`);
      throw new Error(`Error fetching track: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) {
      console.error('[getTrack] Invalid or empty data returned from Strapi:', data);
      return null;
    }

    // Ensure the track has an ID that matches the requested ID
    if (data.data.id?.toString() !== id) {
      console.error(`[getTrack] ID mismatch: requested ${id}, received ${data.data.id}`);
    }
    
    // Normalize the track
    const track = normalizeTrack(data.data);
    
    // Verify that the track was properly normalized with an ID
    if (!track.id) {
      console.error('[getTrack] Track missing ID after normalization:', data.data);
      return null;
    }

    console.log(`[getTrack] Successfully retrieved and normalized track: ${track.title} (${track.id})`);
    
    return track;
  } catch (error) {
    console.error('[getTrack] Error fetching track:', error);
    return null;
  }
}

// Search tracks by query
export async function searchTracks(query: string): Promise<Track[]> {
  try {
    console.log(`[searchTracks] Searching for tracks matching: ${query}`);
    const response = await fetch(
      `${API_URL}/tracks?filters[title][$containsi]=${encodeURIComponent(query)}&populate=*`,
      getRequestOptions()
    );

    if (!response.ok) {
      console.error(`[searchTracks] Error searching tracks: ${response.status}`);
      throw new Error(`Error searching tracks: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) return [];

    return data.data.map(normalizeTrack);
  } catch (error) {
    console.error('[searchTracks] Error in searchTracks:', error);
    return [];
  }
}

// Get tracks filtered by tag IDs
export async function getTracksByTags(tagIds: string[]): Promise<Track[]> {
  if (!tagIds.length) return getTracks();
  
  try {
    console.log(`[getTracksByTags] Fetching tracks with tag IDs: ${tagIds.join(', ')}`);
    const tagFilters = tagIds.map(id => `filters[tags][id][$in]=${id}`).join('&');
    const response = await fetch(`${API_URL}/tracks?${tagFilters}&populate=*`, getRequestOptions());

    if (!response.ok) {
      console.error(`[getTracksByTags] Error fetching tracks by tags: ${response.status}`);
      throw new Error(`Error fetching tracks by tags: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) return [];

    return data.data.map(normalizeTrack);
  } catch (error) {
    console.error('[getTracksByTags] Error in getTracksByTags:', error);
    return [];
  }
}

// Helper function to check if a file exists at a URL
async function checkFileExists(url: string): Promise<boolean> {
  try {
    console.log(`Checking if file exists at URL: ${url}`);
    const response = await fetch(url, { method: 'HEAD' });
    
    const result = response.ok;
    console.log(`File check result for ${url}: ${result ? 'EXISTS' : 'NOT FOUND'}`);
    
    return result;
  } catch (error) {
    console.error(`Error checking file existence at ${url}:`, error);
    return false;
  }
}

// Query the actual files in Strapi upload directory 
async function queryStrapi(): Promise<void> {
  try {
    // Try to get a list of all files in Strapi to help debug
    console.log("Querying Strapi uploads to check what files exist...");
    
    const response = await fetch(`${API_URL}/upload/files`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error(`Failed to query Strapi uploads: ${response.status}`);
      return;
    }
    
    const files = await response.json();
    
    // Log all available audio files
    const audioFiles = files.filter((f: any) => 
      f.mime && f.mime.startsWith('audio/'));
    
    console.log("Available audio files in Strapi:", 
      audioFiles.map((f: any) => ({
        name: f.name,
        url: `${API_URL}${f.url}`,
        ext: f.ext,
        mime: f.mime
      }))
    );
    
    // Suggest possible stem files
    console.log("Suggested stem files to try:");
    ['Drums', 'Bass', 'Keys', 'Guitars'].forEach(stemName => {
      const audioFile = audioFiles.find((f: any) => 
        f.name.toLowerCase().includes(stemName.toLowerCase()));
      
      if (audioFile) {
        console.log(`Found match for ${stemName}: ${API_URL}${audioFile.url}`);
      } else {
        console.log(`No match found for ${stemName}`);
      }
    });
    
  } catch (error) {
    console.error("Error querying Strapi uploads:", error);
  }
}

// Create dummy audio files for testing
async function createDummyAudioFiles(): Promise<void> {
  try {
    console.log("Creating dummy audio files for testing...");
    
    // Define the stems we need
    const stems = ["Drums", "Bass", "Keys", "Guitars"];
    
    for (const stem of stems) {
      const stemFileName = `${stem.replace(/ /g, '_')}.mp3`;
      // Get absolute URL based on window.location
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const targetUrl = `${baseUrl}/api/create-dummy-file?filename=${encodeURIComponent(stemFileName)}`;
      
      console.log(`Attempting to create dummy file for ${stem} at ${stemFileName}`);
      
      try {
        const response = await fetch(targetUrl);
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Successfully created dummy file for ${stem}:`, result);
        } else {
          console.error(`❌ Failed to create dummy file for ${stem}: ${response.status}`);
        }
      } catch (err) {
        console.error(`❌ Error creating dummy file for ${stem}:`, err);
      }
    }
    
    console.log("Dummy file creation completed");
    
  } catch (error) {
    console.error("Error creating dummy audio files:", error);
  }
}

// Export a utility function to help find stem files
export async function findStemFile(stemName: string, trackTitle: string): Promise<string | null> {
  try {
    // Try to find the parent track by title
    const encodedTitle = encodeURIComponent(trackTitle);
    const trackResponse = await fetch(
      `${API_URL}/tracks?filters[title][$containsi]=${encodedTitle}&populate=*`,
      { headers: getHeaders() }
    );
    
    if (!trackResponse.ok) return null;
    
      const trackData = await trackResponse.json();
    if (!trackData?.data?.length) return null;
      
    // Find best matching track
        const matchingTrack = trackData.data.find((t: any) => 
          t.attributes.title.toLowerCase() === trackTitle.toLowerCase()
    ) || trackData.data[0];
        
    // Get stems from track
        const stems = matchingTrack.attributes.stems || [];
    if (!stems.length) return null;
        
    // Find matching stem
          const matchingStem = stems.find((s: any) => 
            (s.name && s.name.toLowerCase() === stemName.toLowerCase()) || 
            (s.Name && s.Name.toLowerCase() === stemName.toLowerCase())
          );
          
          if (matchingStem) {
            const audioFile = matchingStem.audio || matchingStem.file;
      if (audioFile?.data?.attributes?.url) {
        return `${API_URL}${audioFile.data.attributes.url}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding stem file:', error);
    return null;
  }
}

/**
 * Enhanced function to fetch complete track data from Strapi
 * Simplified to rely solely on Strapi for all data
 */
export async function getTracksWithMapping(): Promise<Track[]> {
  try {
    console.log('[getTracksWithMapping] Fetching track data from Strapi');
    
    // Use the same implementation as getTracks - no special handling needed
    return getTracks();
  } catch (error) {
    console.error('[getTracksWithMapping] Error:', error);
    return [];
  }
} 