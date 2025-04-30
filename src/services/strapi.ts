import { Track, Tag, Stem } from '../types';
import { STRAPI_URL, API_URL, API_TOKEN } from '../config/strapi';
import { getProxiedMediaUrl } from '../utils/media-helpers';
import idMappingCache from '../utils/client-mapping';

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
    const trackTitle = data.title || 'Unknown Track';
    
    // Determine UUID for S3 access
    // 1. Check if it's directly in the data
    let s3TrackId = data.uuid || data.s3_uuid || '';
    
    // 2. If not found in data, note that we'll rely on API mapping
    if (!s3TrackId && trackId) {
      console.log(`[normalizeTrack] No direct UUID for track ID ${trackId}, will rely on API mapping`);
    }
    
    // Extract raw URLs or generate paths based on track ID
    // audioUrl and imageUrl will be populated by the frontend using ID
    let audioUrl = data.audioUrl || '';
    let imageUrl = data.imageUrl || '';
    
    // Use UUID from metadata if available, else generate a path to use
    const s3Path = s3TrackId 
      ? `tracks/${s3TrackId}` 
      : `tracks/${trackId}`;  // Use numeric ID - API will handle mapping

    // If no URL was provided, build the audio and image URLs based on the path
    if (!audioUrl) {
      audioUrl = `/api/direct-s3/${s3Path}/main.mp3`;
      console.log(`[normalizeTrack] Generated audio URL: ${audioUrl}`);
    }
    
    if (!imageUrl) {
      imageUrl = `/api/direct-s3/${s3Path}/image`;
      console.log(`[normalizeTrack] Generated image URL: ${imageUrl}`);
    }

    // Always proxy CloudFront URLs to avoid CORS issues
    const proxiedAudioUrl = getProxiedMediaUrl(audioUrl);
    const proxiedImageUrl = getProxiedMediaUrl(imageUrl);
    
    console.log(`[normalizeTrack] Track ${trackTitle} (ID: ${trackId}, S3 Path: ${s3Path})`);
    
    // Process tags from Strapi response
    let tags: Tag[] = [];
    if (data.tags?.data && Array.isArray(data.tags.data)) {
      tags = data.tags.data.map((tag: any) => ({
        id: tag.id.toString(),
        name: tag.attributes?.name || 'Unknown Tag',
        type: tag.attributes?.type || 'genre'
      }));
      
      console.log(`[normalizeTrack] Track ${trackTitle} has ${tags.length} tags: ${tags.map(t => t.name).join(', ')}`);
    } else {
      console.warn(`[normalizeTrack] Track ${trackTitle} has no tags or invalid tag structure`);
    }
    
    return {
      id: trackId,
      title: trackTitle,
      bpm: Number(data.bpm) || 0,
      duration: Number(data.duration) || 0,
      tags: tags,
      stems: data.stems?.data?.map((stem: any) => ({
        id: stem.id.toString(),
        name: stem.attributes?.name || 'Unknown Stem',
        url: getProxiedMediaUrl(stem.attributes?.url || ''),
        price: Number(stem.attributes?.price) || 0,
        duration: Number(stem.attributes?.duration) || 0
      })) || [],
      hasStems: data.stems?.data?.length > 0 || false,
      audioUrl: proxiedAudioUrl,
      imageUrl: proxiedImageUrl,
      waveform: data.waveform || [],
      s3Path
    };
  } catch (error) {
    console.error('Error normalizing track:', error);
    return {
      id: strapiTrack?.id?.toString() || 'error',
      title: 'Error Track',
      bpm: 0,
      duration: 0,
      tags: [],
      stems: [],
      audioUrl: '',
      imageUrl: '',
      hasStems: false,
      waveform: [],
      s3Path: ''
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
      name: item.attributes?.name || 'Unknown Tag',
      type: item.attributes?.type || 'unknown',
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
 * Enhanced function to fetch complete track data from Strapi with direct UUID mapping
 * This removes dependency on hardcoded mappings by fetching and mapping IDs correctly
 */
export async function getTracksWithMapping(): Promise<Track[]> {
  try {
    console.log('[getTracksWithMapping] Fetching complete track data from Strapi');
    
    // Make sure to get tags, stems, and all related data
    const response = await fetch(`${API_URL}/tracks?populate=deep&pagination[pageSize]=100`, getRequestOptions());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getTracksWithMapping] Error fetching tracks: ${response.status}`, errorText);
      throw new Error(`Error fetching tracks: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data || !Array.isArray(data.data)) {
      console.error('[getTracksWithMapping] Invalid or empty data returned from Strapi');
      return [];
    }

    console.log(`[getTracksWithMapping] Retrieved ${data.data.length} tracks from Strapi`);
    
    // Process each track and extract proper info for the frontend
    const processedTracks: Track[] = [];
    
    // 2. Extract essential metadata including UUIDs from Strapi
    const tracks = await Promise.all(data.data.map(async (strapiTrack: any) => {
      try {
        // Get the track ID and data
        const trackId = strapiTrack.id?.toString();
        const trackData = strapiTrack.attributes || strapiTrack;
        
        if (!trackId) {
          console.error('[getTracksWithMapping] Track missing ID:', strapiTrack);
          return null;
        }
        
        // Extract S3 UUID from Strapi metadata fields
        // Check all possible locations where the UUID might be stored
        let s3Uuid = trackData.uuid || 
                    trackData.s3_uuid || 
                    trackData.s3Id || 
                    trackData.s3_id ||
                    trackData.s3TrackId || 
                    trackData.s3_track_id;
                    
        // If there's no direct UUID in the Strapi data, try to get it from the media URLs
        if (!s3Uuid && (trackData.audioUrl || trackData.imageUrl)) {
          const mediaUrl = trackData.audioUrl || trackData.imageUrl;
          const uuidMatch = mediaUrl.match(/tracks\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
          if (uuidMatch && uuidMatch[1]) {
            s3Uuid = uuidMatch[1];
            console.log(`[getTracksWithMapping] Extracted UUID ${s3Uuid} from media URL`);
          }
        }
        
        // As a last resort, dynamically fetch UUID mapping if we have a service for it
        if (!s3Uuid) {
          try {
            // Try to fetch from mapping service
            const mappingResponse = await fetch(`/api/debug/uuid-mapping?action=lookup&strapiId=${trackId}`);
            if (mappingResponse.ok) {
              const mappingData = await mappingResponse.json();
              if (mappingData.uuid) {
                s3Uuid = mappingData.uuid;
                console.log(`[getTracksWithMapping] Found UUID ${s3Uuid} for ID ${trackId} via mapping service`);
              }
            }
          } catch (mappingError) {
            console.error(`[getTracksWithMapping] Error fetching mapping for ID ${trackId}:`, mappingError);
          }
        }
        
        // Generate S3 path based on UUID or track ID
        const s3Path = s3Uuid ? `tracks/${s3Uuid}` : `tracks/${trackId}`;
        
        // Generate URLs for audio and image using dynamic paths
        const audioUrl = `/api/direct-s3/${s3Path}/audio`;
        const imageUrl = `/api/direct-s3/${s3Path}/image`;
        
        // Ensure that any existing URLs are converted to the dynamic endpoints
        const normalizedAudioUrl = trackData.audioUrl?.includes('/main.mp3') 
          ? `/api/direct-s3/${s3Path}/audio` 
          : trackData.audioUrl || audioUrl;
        
        const normalizedImageUrl = trackData.imageUrl?.includes('/cover.jpg') 
          ? `/api/direct-s3/${s3Path}/image` 
          : trackData.imageUrl || imageUrl;
        
        return {
          id: trackId,
          title: trackData.title || 'Unknown Track',
          bpm: Number(trackData.bpm) || 0,
          duration: Number(trackData.duration) || 0,
          tags: trackData.tags?.data?.map((tag: any) => ({
            id: tag.id.toString(),
            name: tag.attributes?.name || 'Unknown Tag',
            type: tag.attributes?.type || 'genre'
          })) || [],
          stems: trackData.stems?.data?.map((stem: any) => ({
            id: stem.id.toString(),
            name: stem.attributes?.name || 'Unknown Stem',
            url: getProxiedMediaUrl(stem.attributes?.url || ''),
            price: Number(stem.attributes?.price) || 0,
            duration: Number(stem.attributes?.duration) || 0
          })) || [],
          hasStems: trackData.stems?.data?.length > 0 || false,
          audioUrl: getProxiedMediaUrl(normalizedAudioUrl),
          imageUrl: getProxiedMediaUrl(normalizedImageUrl),
          waveform: trackData.waveform || [],
          s3Path,
          s3Uuid // Include the UUID in the track data
        };
      } catch (trackError) {
        console.error('[getTracksWithMapping] Error processing track:', trackError);
        return null;
      }
    }));
    
    // Filter out null tracks and return
    return tracks.filter(Boolean) as Track[];
  } catch (error) {
    console.error('[getTracksWithMapping] Error:', error);
    return [];
  }
} 