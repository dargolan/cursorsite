import { Track, Tag, Stem } from '../types';

// Strapi base URL for media files
export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_MEDIA_URL || 'http://localhost:1337';

// Strapi API URL (may be same as STRAPI_URL)
const API_URL_BASE = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

// Make sure the API URL is correctly formatted with or without trailing slash
const API_URL = `${API_URL_BASE.endsWith('/') ? API_URL_BASE.slice(0, -1) : API_URL_BASE}/api`;

const API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

console.log('Using Strapi Media URL:', STRAPI_URL);
console.log('Using Strapi API URL:', API_URL);

/**
 * Get the Strapi media URL
 * @returns The base URL for Strapi media files
 */
export function getStrapiMediaUrl(): string {
  return STRAPI_URL;
}

// Helper to format the image URL
const getStrapiMedia = (url: string | null) => {
  if (!url) return null;
  // Return the full URL if it's already absolute
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
};

// Helper function to create request headers
const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  
  return headers;
};

// Normalize Strapi response format to our frontend types
const normalizeTrack = (strapiTrack: any): Track => {
  try {
    console.log('Normalizing track:', strapiTrack);
    
    // Track fields might be directly in the object (not in attributes)
    const titleField = strapiTrack.Title || strapiTrack.title || 
                      (strapiTrack.attributes && (strapiTrack.attributes.Title || strapiTrack.attributes.title)) || 
                      'Unknown Track';
                      
    const bpmField = strapiTrack.BPM || strapiTrack.bpm || 
                    (strapiTrack.attributes && (strapiTrack.attributes.BPM || strapiTrack.attributes.bpm)) || 
                    0;
                    
    const durationField = strapiTrack.Duration || strapiTrack.duration || 
                         (strapiTrack.attributes && (strapiTrack.attributes.Duration || strapiTrack.attributes.duration)) || 
                         0;
    
    // Handle image, could be direct field or in attributes
    const imageData = strapiTrack.Image || strapiTrack.image || 
                     (strapiTrack.attributes && (strapiTrack.attributes.Image || strapiTrack.attributes.image));
    
    // Handle audio, could be direct field or in attributes
    const audioData = strapiTrack.AudioPreview || strapiTrack.audioPreview || strapiTrack.audio_preview || strapiTrack.audio || 
                     (strapiTrack.attributes && (strapiTrack.attributes.AudioPreview || strapiTrack.attributes.audioPreview || 
                                                strapiTrack.attributes.audio_preview || strapiTrack.attributes.audio));
    
    // Handle tags array, could be direct field or in attributes
    const tagsData = strapiTrack.tags || 
                    (strapiTrack.attributes && strapiTrack.attributes.tags) || 
                    [];
    
    // Handle stems array, could be direct field or in attributes
    const stemsData = strapiTrack.stems || 
                     (strapiTrack.attributes && strapiTrack.attributes.stems) || 
                     [];

    // Safe extraction of tags
    let normalizedTags: Tag[] = [];
    try {
      // Handle tags based on structure - might be array or {data: [...]}
      const tags = Array.isArray(tagsData) ? tagsData : (tagsData?.data || []);
      normalizedTags = Array.isArray(tags) ? tags.map(normalizeTag) : [];
      console.log(`Processed ${normalizedTags.length} tags for track ${strapiTrack.id}`);
    } catch (err) {
      console.error('Error processing tags for track:', strapiTrack.id, err);
    }

    // Process stems if they exist
    let normalizedStems: Stem[] = [];
    try {
      const stems = strapiTrack.stems || [];
      
      // Hardcoded stem names to filename mapping based on console logs
      const getKnownStemUrl = (stemName: string): string => {
        // Simplify the approach - don't use hashes in the URLs
        // Just create a direct mapping to simpler filenames
        return `${STRAPI_URL}/uploads/${stemName.replace(/ /g, '_')}.mp3`;
      };
      
      normalizedStems = stems.length ? stems.map((stem: any, index: number) => {
        try {
          // Extract or generate name
          const stemName = stem.Name || stem.name || 
                           (stem.attributes && (stem.attributes.Name || stem.attributes.name)) || 
                           `Stem ${index + 1}`;
                           
          // Extract or default price
          const stemPrice = stem.Price || stem.price || 
                           (stem.attributes && (stem.attributes.Price || stem.attributes.price)) || 
                           0;
                           
          console.log(`Processing stem: ${stemName}`);
          
          // Generate a simpler URL approach
          // This creates predictable URLs without hashes
          const simpleUrl = getKnownStemUrl(stemName);
          
          // Create fallback URLs with various naming conventions
          const fallbackUrls = [
            simpleUrl,
            // Try with track title included
            `${STRAPI_URL}/uploads/${stemName.replace(/ /g, '_')}_Elevator_Music.mp3`,
            // Try with different word separators
            `${STRAPI_URL}/uploads/${stemName.replace(/ /g, '-')}.mp3`,
            // Try with .wav extension
            `${STRAPI_URL}/uploads/${stemName.replace(/ /g, '_')}.wav`
          ];
          
          // Store all fallback URLs
          const stemAlternativeUrl = JSON.stringify(fallbackUrls);
          
          return {
            id: `${strapiTrack.id}-stem-${index}`,
            name: stemName,
            url: simpleUrl,
            alternativeUrl: stemAlternativeUrl,
            price: stemPrice,
            duration: strapiTrack.Duration || 180, // Use track duration as fallback
            waveform: [] // Default empty waveform
          };
        } catch (err) {
          console.error(`Error processing stem ${index} for track ${strapiTrack.id}:`, err);
          return {
            id: `${strapiTrack.id}-stem-error-${index}`,
            name: `Error Stem ${index + 1}`,
            url: '',
            alternativeUrl: '',
            price: 0,
            duration: 0
          };
        }
      }) : [];
      console.log(`Processed ${normalizedStems.length} stems for track ${strapiTrack.id}`);
    } catch (err) {
      console.error('Error processing stems for track:', strapiTrack.id, err);
    }

    // Audio file URL handling
    let audioUrl = '';
    try {
      // Handle audioData structure which could be nested
      const audioFile = audioData?.url || // Direct URL
                       (audioData?.data?.attributes?.url); // Nested in data.attributes
      
      audioUrl = audioFile ? `${STRAPI_URL}${audioFile}` : '';
      console.log('Audio URL:', audioUrl);
    } catch (err) {
      console.error('Error processing audio URL for track:', strapiTrack.id, err);
    }

    // Image file URL handling
    let imageUrl = '';
    try {
      // Handle imageData structure which could be nested
      const imageFile = imageData?.url || // Direct URL
                       (imageData?.data?.attributes?.url); // Nested in data.attributes
      
      imageUrl = imageFile ? `${STRAPI_URL}${imageFile}` : '';
      console.log('Image URL:', imageUrl);
    } catch (err) {
      console.error('Error processing image URL for track:', strapiTrack.id, err);
    }

    return {
      id: strapiTrack.id.toString(),
      title: titleField,
      bpm: bpmField,
      duration: durationField,
      tags: normalizedTags,
      stems: normalizedStems,
      audioUrl,
      imageUrl,
      hasStems: normalizedStems.length > 0,
      waveform: strapiTrack.waveform || []
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
};

// Normalize Strapi tag format to our frontend type
const normalizeTag = (strapiTag: any): Tag => {
  try {
    console.log('Normalizing tag:', strapiTag);
    
    // Tags might have data directly in the object (not in attributes)
    // Handle both structures for maximum compatibility
    const nameField = strapiTag.Name || strapiTag.name || 
                     (strapiTag.attributes && (strapiTag.attributes.Name || strapiTag.attributes.name));
                     
    const typeField = strapiTag.Type || strapiTag.type || 
                     (strapiTag.attributes && (strapiTag.attributes.Type || strapiTag.attributes.type));
    
    if (!nameField) {
      console.error('Tag missing name field:', strapiTag);
      return {
        id: strapiTag.id?.toString() || 'unknown',
        name: 'Unknown Tag',
        type: 'genre'
      };
    }
    
    // Ensure type is one of the allowed values
    let mappedType = (typeField || 'genre').toLowerCase();
    // Map "genre", "mood", or "instrument" - case insensitive
    if (mappedType.includes('genre')) {
      mappedType = 'genre';
    } else if (mappedType.includes('mood')) {
      mappedType = 'mood';
    } else if (mappedType.includes('instrument')) {
      mappedType = 'instrument';
    } else {
      mappedType = 'genre'; // Default
    }
    
    const validType = mappedType as 'genre' | 'mood' | 'instrument';
    
    return {
      id: strapiTag.id.toString(),
      name: nameField,
      type: validType
    };
  } catch (error) {
    console.error('Error normalizing tag:', error);
    return {
      id: strapiTag?.id?.toString() || 'error',
      name: 'Error Tag',
      type: 'genre'
    };
  }
};

// Fallback data for when API is unavailable
const MOCK_TRACKS: Track[] = [
  {
    id: 'mock-1',
    title: 'Demo Track (API Unavailable)',
    bpm: 128,
    tags: [
      { id: 'mock-tag-1', name: 'House', type: 'genre' },
      { id: 'mock-tag-2', name: 'Energetic', type: 'mood' },
    ],
    duration: 180,
    imageUrl: 'https://placehold.co/600x400?text=Demo+Track',
    audioUrl: '',  // No audio for mock data
    waveform: Array(100).fill(0).map(() => Math.random() * 0.8 + 0.2),
    hasStems: false,
    stems: [],
  }
];

const MOCK_TAGS: Tag[] = [
  { id: 'mock-tag-1', name: 'House', type: 'genre' },
  { id: 'mock-tag-2', name: 'Energetic', type: 'mood' },
  { id: 'mock-tag-3', name: 'Piano', type: 'instrument' },
  { id: 'mock-tag-4', name: 'Chill', type: 'mood' },
  { id: 'mock-tag-5', name: 'Electronic', type: 'genre' },
];

// Fetch all tracks from Strapi
async function getTracks(): Promise<Track[]> {
  try {
    const url = `${API_URL}/tracks?populate=*`;
    console.log('Fetching tracks from URL:', url);
    
    console.log('Using headers:', JSON.stringify(getHeaders()));
    
    // Try a simpler fetch first to verify the connection
    let strapiServerReachable = false;
    try {
      const pingResponse = await fetch('http://localhost:1337/admin/ping', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      
      if (pingResponse.ok) {
        console.log('✅ Connection to Strapi server confirmed');
        strapiServerReachable = true;
      } else {
        console.warn('⚠️ Connection to Strapi possible but ping failed:', pingResponse.status);
      }
    } catch (e: any) {
      console.error('❌ Cannot connect to Strapi server:', e);
      
      // If we can't reach the server at all, return mock data immediately
      if (e?.name === 'AbortError' || e?.name === 'TypeError') {
        console.log('⚠️ Returning mock data due to connection issue');
        return MOCK_TRACKS;
      }
    }

    // Skip the main fetch if we already know the server is unreachable
    if (!strapiServerReachable) {
      console.log('⚠️ Strapi server is unreachable, returning mock data');
      return MOCK_TRACKS;
    }
    
    // Try the main fetch with more options for troubleshooting
    const response = await fetch(
      url, 
      { 
        next: { revalidate: 60 },
        headers: getHeaders(),
        cache: 'no-store', // Disable cache to ensure fresh data
        mode: 'cors',  // Explicitly specify CORS mode
        credentials: 'same-origin'
      }
    );
    
    if (!response.ok) {
      console.error(`Error fetching tracks. Status: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error fetching tracks: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw response from Strapi /tracks:', JSON.stringify(data, null, 2));
    
    // Check if data has the expected structure - it could be in different formats
    if (!data) {
      console.error('Unexpected data structure. No data returned:', data);
      return MOCK_TRACKS;
    }
    
    // Handle different possible structures:
    // 1. Direct array of tracks
    // 2. { data: [...tracks] } structure
    // 3. A single track object

    let tracksArray: any[] = [];
    
    if (Array.isArray(data)) {
      // Case 1: Direct array of tracks
      tracksArray = data;
      console.log('Data is a direct array of tracks');
    } else if (data.data) {
      // Case 2: { data: [...tracks] } structure 
      tracksArray = Array.isArray(data.data) ? data.data : [data.data];
      console.log('Data is in { data: [...] } format');
    } else if (data.id) {
      // Case 3: A single track object
      tracksArray = [data];
      console.log('Data is a single track object');
    } else {
      console.error('Unknown data structure:', data);
      return MOCK_TRACKS;
    }
    
    console.log(`Processing ${tracksArray.length} tracks`);
    
    if (tracksArray.length === 0) {
      console.warn('No tracks returned from API, using mock data');
      return MOCK_TRACKS;
    }
    
    // Log each track for debugging
    tracksArray.forEach((track, index) => {
      console.log(`Track ${index + 1}:`, JSON.stringify(track, null, 2));
    });
    
    // Process each track from Strapi response into our app's format
    const trackPromises = tracksArray.map(async (strapiTrack: any) => {
      try {
        console.log('Raw track data:', JSON.stringify(strapiTrack, null, 2));
        
        // Normalize Strapi response to our data structure
        const normalizedTrack = await normalizeTrack(strapiTrack);
        return normalizedTrack;
      } catch (err) {
        console.error(`Error processing track ${strapiTrack.id}:`, err);
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
    });
    
    const normalizedTracks = await Promise.all(trackPromises);
    return normalizedTracks;
  } catch (error) {
    console.error('Error fetching tracks:', error);
    console.log('Returning mock tracks as fallback');
    return MOCK_TRACKS;
  }
}

// Fetch all tags from Strapi
async function getTags(): Promise<Tag[]> {
  try {
    const url = `${API_URL}/tags?populate=tracks`;
    console.log('Fetching tags from URL:', url);
    
    const response = await fetch(
      url, 
      { 
        next: { revalidate: 300 },
        headers: getHeaders(),
        cache: 'no-store', // Disable cache to ensure fresh data
        mode: 'cors',      // Explicitly specify CORS mode
        credentials: 'same-origin'
      }
    );
    
    if (!response.ok) {
      console.error(`Error fetching tags. Status: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error fetching tags: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw response from Strapi /tags:', JSON.stringify(data, null, 2));
    
    // Check if data has the expected structure - it could be in different formats
    if (!data) {
      console.error('Unexpected data structure. No data returned:', data);
      return MOCK_TAGS;
    }
    
    // Handle different possible structures:
    // 1. Direct array of tags
    // 2. { data: [...tags] } structure
    // 3. A single tag object

    let tagsArray: any[] = [];
    
    if (Array.isArray(data)) {
      // Case 1: Direct array of tags
      tagsArray = data;
      console.log('Data is a direct array of tags');
    } else if (data.data) {
      // Case 2: { data: [...tags] } structure 
      tagsArray = Array.isArray(data.data) ? data.data : [data.data];
      console.log('Data is in { data: [...] } format');
    } else if (data.id) {
      // Case 3: A single tag object
      tagsArray = [data];
      console.log('Data is a single tag object');
    } else {
      console.error('Unknown data structure:', data);
      return MOCK_TAGS;
    }
    
    console.log(`Processing ${tagsArray.length} tags`);
    
    if (tagsArray.length === 0) {
      console.warn('No tags returned from API, using mock data');
      return MOCK_TAGS;
    }
    
    // Log each tag for debugging
    tagsArray.forEach((tag, index) => {
      console.log(`Tag ${index + 1}:`, JSON.stringify(tag, null, 2));
    });
    
    return tagsArray.map(normalizeTag);
  } catch (error) {
    console.error('Error fetching tags:', error);
    console.log('Returning mock tags as fallback');
    return MOCK_TAGS;
  }
}

// Fetch a single track by ID
async function getTrack(id: string): Promise<Track | null> {
  try {
    const response = await fetch(
      `${API_URL}/tracks/${id}?populate=*`, 
      { 
        next: { revalidate: 60 },
        headers: getHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching track ${id}: ${response.status}`);
    }
    
    const data = await response.json();
    return normalizeTrack(data.data);
  } catch (error) {
    console.error(`Error fetching track ${id}:`, error);
    return null;
  }
}

// Search tracks by query
async function searchTracks(query: string): Promise<Track[]> {
  try {
    const response = await fetch(
      `${API_URL}/tracks?filters[title][$containsi]=${encodeURIComponent(query)}&populate=*`,
      { 
        cache: 'no-store',
        headers: getHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error searching tracks: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.map(normalizeTrack);
  } catch (error) {
    console.error('Error searching tracks:', error);
    return [];
  }
}

// Get tracks filtered by tag IDs
async function getTracksByTags(tagIds: string[]): Promise<Track[]> {
  if (!tagIds.length) return getTracks();
  
  try {
    // Build query for multiple tag IDs
    const tagFilters = tagIds.map(id => 
      `filters[tags][id][$in]=${id}`
    ).join('&');
    
    const response = await fetch(
      `${API_URL}/tracks?${tagFilters}&populate=*`,
      { 
        cache: 'no-store',
        headers: getHeaders(),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching tracks by tags: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.map(normalizeTrack);
  } catch (error) {
    console.error('Error fetching tracks by tags:', error);
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
        url: `${STRAPI_URL}${f.url}`,
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
        console.log(`Found match for ${stemName}: ${STRAPI_URL}${audioFile.url}`);
      } else {
        console.log(`No match found for ${stemName}`);
      }
    });
    
  } catch (error) {
    console.error("Error querying Strapi uploads:", error);
  }
}

// Function to try to fetch file info directly from Strapi's upload API
async function findFileInStrapiByName(filename: string): Promise<string | null> {
  try {
    // Use the API to search for files
    const apiUrl = `${STRAPI_URL}/api/upload/files?filters[name][$contains]=${encodeURIComponent(filename)}`;
    console.log(`Searching for file in Strapi: ${filename}`);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const files = await response.json();
    if (files && files.length > 0) {
      // Get the URL from the first matching file
      const url = files[0].url.startsWith('/') 
        ? `${STRAPI_URL}${files[0].url}` 
        : `${STRAPI_URL}/${files[0].url}`;
      
      console.log(`Found file: ${filename} -> ${url}`);
      return url;
    }
    
    console.log(`No file found with name: ${filename}`);
    return null;
  } catch (error) {
    console.error(`Error searching for file "${filename}":`, error);
    return null;
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
    console.log(`Finding stem file: "${stemName}" for track "${trackTitle}"`);
    
    // Step 1: First try to find the parent track by title
    // This is a more reliable approach as it preserves the track-stem relationship
    const encodedTitle = encodeURIComponent(trackTitle);
    const trackApiUrl = `${API_URL}/tracks?filters[title][$containsi]=${encodedTitle}&populate=*`;
    
    console.log(`Searching for parent track: ${trackApiUrl}`);
    const trackResponse = await fetch(trackApiUrl, {
      headers: getHeaders()
    });
    
    if (trackResponse.ok) {
      const trackData = await trackResponse.json();
      
      if (trackData.data && trackData.data.length > 0) {
        console.log(`Found ${trackData.data.length} matching tracks`);
        
        // Find the best matching track
        const matchingTrack = trackData.data.find((t: any) => 
          t.attributes.title.toLowerCase() === trackTitle.toLowerCase()
        ) || trackData.data[0]; // Fallback to first result if no exact match
        
        console.log(`Selected track: ${matchingTrack.attributes.title} (ID: ${matchingTrack.id})`);
        
        // Get the stems from the track
        const stems = matchingTrack.attributes.stems || [];
        
        if (stems.length > 0) {
          console.log(`Track has ${stems.length} stems`);
          
          // Find the stem by name
          const matchingStem = stems.find((s: any) => 
            (s.name && s.name.toLowerCase() === stemName.toLowerCase()) || 
            (s.Name && s.Name.toLowerCase() === stemName.toLowerCase())
          );
          
          if (matchingStem) {
            console.log(`Found matching stem: ${matchingStem.name || matchingStem.Name}`);
            
            // Get the audio file URL from the stem
            const audioFile = matchingStem.audio || matchingStem.file;
            
            if (audioFile && audioFile.data && audioFile.data.attributes) {
              const url = `${STRAPI_URL}${audioFile.data.attributes.url}`;
              console.log(`✅ Found stem URL from track-stem relationship: ${url}`);
              return url;
            }
          }
          
          console.log(`No matching stem found with name "${stemName}" in track stems`);
        } else {
          console.log(`Track has no stems`);
        }
      } else {
        console.log(`No tracks found matching "${trackTitle}"`);
      }
    } else {
      console.log(`Error fetching track: ${trackResponse.status}`);
    }
    
    // Step 2: Fallback - try to find by file pattern (our previous approach)
    console.log('Falling back to file pattern search');
    
    // Clean up names for filename matching
    const cleanStemName = stemName.replace(/ /g, '_');
    const cleanTrackTitle = trackTitle.replace(/ /g, '_');
    
    // Build URL patterns to try (based on the file naming patterns we observed)
    const patterns = [
      `${cleanStemName}_${cleanTrackTitle}`, // Example: Drums_Elevator_music
      `${cleanTrackTitle}_${cleanStemName}`, // Example: Elevator_music_Drums
      `${cleanStemName}`,                    // Example: Drums
    ];
    
    console.log('Attempting to find stem file with patterns:', patterns);
    
    // Try to find the file on the server
    const apiUrl = `${STRAPI_URL}/api/upload/files`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Error fetching files: ${response.status}`);
    }
    
    const files = await response.json();
    console.log(`Found ${files.length} total files on server`);
    
    // Filter to just audio files (include all audio formats)
    const audioFiles = files.filter((f: any) => 
      f.mime && (f.mime.startsWith('audio/') || f.mime.includes('audio'))
    );
    console.log(`Found ${audioFiles.length} audio files`);
    
    // Log available audio files for debugging
    console.log("Available audio files:", audioFiles.map((f: any) => f.name));
    
    // Try to find a match using our patterns
    let possibleMatches = [];
    
    for (const pattern of patterns) {
      const matches = audioFiles.filter((f: any) => {
        const fileName = f.name.toLowerCase();
        const patternLower = pattern.toLowerCase();
        return fileName.includes(patternLower);
      });
      
      if (matches.length > 0) {
        possibleMatches.push(...matches);
      }
    }
    
    // Prioritize more specific matches
    possibleMatches.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Check if file contains both stem name and track title
      const aHasBoth = aName.includes(cleanStemName.toLowerCase()) && aName.includes(cleanTrackTitle.toLowerCase());
      const bHasBoth = bName.includes(cleanStemName.toLowerCase()) && bName.includes(cleanTrackTitle.toLowerCase());
      
      if (aHasBoth && !bHasBoth) return -1;
      if (!aHasBoth && bHasBoth) return 1;
      
      // Prefer shorter filenames (less noise)
      return aName.length - bName.length;
    });
    
    if (possibleMatches.length > 0) {
      const bestMatch = possibleMatches[0];
      const url = bestMatch.url.startsWith('/') 
        ? `${STRAPI_URL}${bestMatch.url}` 
        : `${STRAPI_URL}/${bestMatch.url}`;
      
      console.log(`⚠️ Found stem file by pattern matching: ${url}`);
      return url;
    }
    
    console.log(`❌ No matching file found for ${stemName} in ${trackTitle}`);
    return null;
  } catch (error) {
    console.error('Error finding stem file:', error);
    return null;
  }
}

// Export functions to be used by other components
export {
  getStrapiMedia,
  getHeaders,
  normalizeTrack,
  normalizeTag,
  getTracks,
  getTags,
  getTrack,
  searchTracks,
  getTracksByTags,
  checkFileExists,
  queryStrapi,
  findFileInStrapiByName,
  createDummyAudioFiles
}; 