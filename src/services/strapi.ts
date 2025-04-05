import { Track, Tag, Stem } from '../types';

// Strapi base URL for media files
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_MEDIA_URL || 'http://localhost:1337';

// Strapi API URL (may be same as STRAPI_URL)
const API_URL_BASE = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

// Make sure the API URL is correctly formatted with or without trailing slash
const API_URL = `${API_URL_BASE.endsWith('/') ? API_URL_BASE.slice(0, -1) : API_URL_BASE}/api`;

const API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

console.log('Using Strapi Media URL:', STRAPI_URL);
console.log('Using Strapi API URL:', API_URL);

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

    // Safe extraction of stems
    let normalizedStems: Stem[] = [];
    try {
      // Handle stems based on structure - might be array or {data: [...]}
      const stems = Array.isArray(stemsData) ? stemsData : (stemsData?.data || []);
      
      // Process stems by mapping each one safely
      normalizedStems = Array.isArray(stems) ? stems.map((stem: any, index: number) => {
        try {
          // Get stem name and price from direct fields or attributes
          const stemName = stem.Name || stem.name || 
                          (stem.attributes && (stem.attributes.Name || stem.attributes.name)) ||
                          `Stem ${index + 1}`;
                          
          const stemPrice = stem.Price || stem.price || 
                           (stem.attributes && (stem.attributes.Price || stem.attributes.price)) || 
                           0;
                           
          // For audio URL, we need to check if audio is nested or direct
          const stemAudio = stem.audio || (stem.attributes && stem.attributes.audio) || {};
          const audioUrl = stemAudio?.data?.attributes?.url ? 
            `${STRAPI_URL}${stemAudio.data.attributes.url}` : '';
            
          return {
            id: `${strapiTrack.id}-stem-${index}`,
            name: stemName,
            url: audioUrl,
            price: stemPrice,
            duration: 0, // Default duration
            waveform: [] // Default empty waveform
          };
        } catch (err) {
          console.error(`Error processing stem ${index} for track ${strapiTrack.id}:`, err);
          return {
            id: `${strapiTrack.id}-stem-error-${index}`,
            name: `Error Stem ${index + 1}`,
            url: '',
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
export async function getTracks(): Promise<Track[]> {
  try {
    const url = `${API_URL}/tracks?populate=*`;
    console.log('Fetching tracks from URL:', url);
    
    console.log('Using headers:', JSON.stringify(getHeaders()));
    
    // Try a simpler fetch first to verify the connection
    try {
      const pingResponse = await fetch('http://localhost:1337/admin/ping');
      if (pingResponse.ok) {
        console.log('✅ Connection to Strapi server confirmed');
      } else {
        console.warn('⚠️ Connection to Strapi possible but ping failed:', pingResponse.status);
      }
    } catch (e) {
      console.error('❌ Cannot connect to Strapi server at all:', e);
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
    
    return tracksArray.map(normalizeTrack);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    console.log('Returning mock tracks as fallback');
    return MOCK_TRACKS;
  }
}

// Fetch all tags from Strapi
export async function getTags(): Promise<Tag[]> {
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
export async function getTrack(id: string): Promise<Track | null> {
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
export async function searchTracks(query: string): Promise<Track[]> {
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
export async function getTracksByTags(tagIds: string[]): Promise<Track[]> {
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