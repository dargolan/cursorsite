import { Track, Tag, Stem } from '../types';
import { STRAPI_URL, API_URL, API_TOKEN } from '../config/strapi';

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
export function getHeaders() {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  return headers;
}

// Helper to format the image URL
export function getStrapiMedia(url: string | null) {
  if (!url) return null;
  // Return the full URL if it's already absolute
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

// Normalize Strapi response format to our frontend types
export function normalizeTrack(strapiTrack: any): Track {
  try {
    // Extract data from attributes if present
    const data = strapiTrack.attributes || strapiTrack;
    
    return {
      id: strapiTrack.id?.toString() || '',
      title: data.title || 'Unknown Track',
      bpm: Number(data.bpm) || 0,
      duration: Number(data.duration) || 0,
      tags: data.tags?.data?.map((tag: any) => ({
        id: tag.id.toString(),
        name: tag.attributes?.name || 'Unknown Tag',
        type: tag.attributes?.type || 'genre'
      })) || [],
      stems: data.stems?.data?.map((stem: any) => ({
        id: stem.id.toString(),
        name: stem.attributes?.name || 'Unknown Stem',
        url: stem.attributes?.url || '',
        price: Number(stem.attributes?.price) || 0,
        duration: Number(stem.attributes?.duration) || 0
      })) || [],
      hasStems: data.stems?.data?.length > 0 || false,
      audioUrl: data.audioUrl || '',
      imageUrl: data.imageUrl || '',
      waveform: data.waveform || []
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
      waveform: []
    };
  }
}

// Get all tags from Strapi
export async function getTags(): Promise<Tag[]> {
  try {
    const response = await fetch(`${API_URL}/tags?populate=*`, {
      headers: getHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Error fetching tags: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) return [];

    return data.data.map((item: any) => ({
      id: item.id.toString(),
      name: item.attributes?.name || 'Unknown Tag',
      type: item.attributes?.type || 'unknown',
      count: 0
    }));
  } catch (error) {
    console.error('Error in getTags:', error);
    return [];
  }
}

// Get all tracks from Strapi
export async function getTracks(): Promise<Track[]> {
  try {
    const response = await fetch(`${API_URL}/tracks?populate=*`, {
      headers: getHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Error fetching tracks: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) return [];

    return data.data
      .map((item: any) => {
        try {
          return normalizeTrack(item);
        } catch (e) {
          console.error('Error processing track:', e);
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    console.error('Error in getTracks:', error);
    return [];
  }
}

// Get a single track by ID
export async function getTrack(id: string): Promise<Track | null> {
  try {
    const response = await fetch(`${API_URL}/tracks/${id}?populate=*`, {
      headers: getHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Error fetching track: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) return null;

    return normalizeTrack(data.data);
  } catch (error) {
    console.error('Error in getTrack:', error);
    return null;
  }
}

// Search tracks by query
export async function searchTracks(query: string): Promise<Track[]> {
  try {
    const response = await fetch(
      `${API_URL}/tracks?filters[title][$containsi]=${encodeURIComponent(query)}&populate=*`,
      {
        headers: getHeaders(),
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`Error searching tracks: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) return [];

    return data.data.map(normalizeTrack);
  } catch (error) {
    console.error('Error in searchTracks:', error);
    return [];
  }
}

// Get tracks filtered by tag IDs
export async function getTracksByTags(tagIds: string[]): Promise<Track[]> {
  if (!tagIds.length) return getTracks();
  
  try {
    const tagFilters = tagIds.map(id => `filters[tags][id][$in]=${id}`).join('&');
    const response = await fetch(`${API_URL}/tracks?${tagFilters}&populate=*`, {
      headers: getHeaders(),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Error fetching tracks by tags: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data) return [];

    return data.data.map(normalizeTrack);
  } catch (error) {
    console.error('Error in getTracksByTags:', error);
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