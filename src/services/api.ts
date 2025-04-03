import { Track, Tag, Stem } from '../types';
import { mockTracks } from "./mockData";

// Define the base URL for your Strapi API
const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

// Strapi API token - should be in env vars in production
const API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

/**
 * Get all tracks from Strapi
 */
export async function getTracks(): Promise<Track[]> {
  // Debug info
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_API_URL;
  const hasToken = !!process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
  console.log(`API URL: ${apiUrl}, Has token: ${hasToken}, Environment: ${typeof window === 'undefined' ? 'server' : 'browser'}`);

  try {
    let url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/tracks?populate=*`;
    console.log(`Fetching from URL: ${url}`);
    
    const res = await fetch(url, {
      headers: process.env.NEXT_PUBLIC_STRAPI_API_TOKEN
        ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}` }
        : {},
      // Add a shorter timeout to fail faster if Strapi is down
      signal: AbortSignal.timeout(5000)  
    });

    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      console.log("Returning mock data due to API error");
      return mockTracks;
    }

    const responseData = await res.json();
    console.log("API response received");

    // Handle no tracks case
    if (!responseData.data || !Array.isArray(responseData.data)) {
      console.log("No tracks data found in API response, using mock data");
      return mockTracks;
    }

    // Debug info for the first track
    if (responseData.data.length > 0) {
      console.log("First track structure:", JSON.stringify(responseData.data[0], null, 2));
    }

    // Transform the data
    const tracks = responseData.data.map((item: any) => {
      try {
        // Extract attributes, handling both new and old Strapi formats
        const data = item.attributes || item;
        
        // Debug stems
        if (data.stems && Array.isArray(data.stems.data)) {
          console.log(`Track ${data.title} has ${data.stems.data.length} stems`);
        }
        
        // Process tags - handle both formats
        let tags: Tag[] = [];
        if (data.tags) {
          if (data.tags.data && Array.isArray(data.tags.data)) {
            // New Strapi format
            tags = data.tags.data.map((tag: any) => ({
              id: tag.id.toString(),
              name: tag.attributes ? tag.attributes.name : (tag.name || 'Unknown Tag'),
              type: tag.attributes?.type || tag.type || 'genre'
            }));
          } else if (Array.isArray(data.tags)) {
            // Old format
            tags = data.tags.map((tag: any) => ({
              id: tag.id.toString(),
              name: tag.name || 'Unknown Tag',
              type: tag.type || 'genre'
            }));
          }
        }
        
        // Process stems - handle both formats
        let stems: Stem[] = [];
        let hasStems = false;
        if (data.stems) {
          if (data.stems.data && Array.isArray(data.stems.data)) {
            // New Strapi format
            stems = data.stems.data.map((stem: any) => {
              const stemAttrs = stem.attributes || stem;
              return {
                id: stem.id.toString(),
                name: stemAttrs.name || 'Unknown Stem',
                url: stemAttrs.url || stemAttrs.audio?.data?.attributes?.url || '',
                price: Number(stemAttrs.price || 0),
                duration: Number(stemAttrs.duration || 0)
              };
            });
          } else if (Array.isArray(data.stems)) {
            // Old format
            stems = data.stems.map((stem: any) => ({
              id: stem.id.toString(),
              name: stem.name || 'Unknown Stem',
              url: stem.url || stem.audio?.url || '',
              price: Number(stem.price || 0),
              duration: Number(stem.duration || 0)
            }));
          }
          hasStems = stems.length > 0;
        }
        
        // Create waveform array from URL if needed
        const waveform = data.waveform?.data ? [1, 0.8, 0.6, 0.4, 0.6, 0.8, 1] : undefined; // Placeholder waveform
        
        return {
          id: item.id.toString(),
          title: data.title || 'Untitled Track',
          bpm: data.bpm ? parseFloat(data.bpm) : 120,
          duration: data.duration ? parseFloat(data.duration) : 180,
          tags: tags,
          stems: stems,
          hasStems: hasStems,
          audioUrl: data.audio?.data?.attributes?.url || data.audio?.url || '',
          waveform: waveform,
          imageUrl: data.image?.data?.attributes?.url || data.image?.url || '',
        } as Track;
      } catch (e) {
        console.error(`Error processing track data:`, e);
        return null;
      }
    }).filter(Boolean) as Track[];

    // If no valid tracks were processed, return mock data
    if (tracks.length === 0) {
      console.log("No valid tracks after transformation, using mock data");
      return mockTracks;
    }

    return tracks;
  } catch (error) {
    console.log('Falling back to mock track data');
    return mockTracks;
  }
}

/**
 * Get all tags from Strapi
 */
export async function getTags(): Promise<Tag[]> {
  try {
    // Modified to use public endpoint
    const fullUrl = `${API_URL}/api/tags`;
    console.log('Fetching tags from:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': API_TOKEN ? `Bearer ${API_TOKEN}` : '',
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Failed to fetch tags: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw tags data structure:', Object.keys(data));
    
    // Return mock data if API returns no data
    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn('No tags found in API response, returning mock data');
      return getMockTags();
    }
    
    console.log(`Received ${data.data.length} tags from API`);
    
    // Transform Strapi response to our Tag type
    return data.data
      .filter((item: any) => item && item.Name)
      .map((item: any) => {
        return {
          id: item.id?.toString() || '',
          name: item.Name || 'Unknown Tag',
          type: ensureValidType(item.Category),
        };
      });
  } catch (error) {
    console.log('Falling back to mock tag data');
    return getMockTags();
  }
}

// Helper function to ensure tag type is valid
function ensureValidType(category: string | undefined): 'genre' | 'mood' | 'instrument' {
  if (category === 'genre' || category === 'mood' || category === 'instrument') {
    return category;
  }
  
  // Default to genre if category is invalid
  return 'genre';
}

/**
 * Get a single track by ID with its stems
 */
export async function getTrack(id: string): Promise<Track | null> {
  try {
    // Find the track in mock data first
    const mockTracks = getMockTracks();
    const mockTrack = mockTracks.find(track => track.id === id);
    if (mockTrack) {
      return mockTrack;
    }
    
    // Only try Strapi API if mock data doesn't have the track
    const response = await fetch(`${API_URL}/api/tracks/${id}?populate=*`, {
      headers: {
        'Authorization': API_TOKEN ? `Bearer ${API_TOKEN}` : '',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, await response.text());
      throw new Error(`Failed to fetch track ${id}: ${response.status}`);
    }
    
    const data = await response.json();
    const item = data.data;
    
    if (!item) {
      console.warn('Invalid track data received');
      return null;
    }
    
    return {
      id: item.id?.toString() || '',
      title: item.Title || 'Untitled Track', // Changed from track.title
      bpm: item.BPM || 120, // Changed from track.bpm
      duration: item.Duration || 0, // Changed from track.duration
      imageUrl: item.Cover?.url || '', // Changed structure
      audioUrl: item.Audio?.url || '', // Changed structure
      hasStems: Boolean(item.stems?.length), // Changed structure
      tags: (item.tags || []).map((tag: any) => ({
        id: tag.id?.toString() || '',
        name: tag.Name || 'Unknown Tag', // Changed from name
        type: ensureValidType(tag.Category), // Changed from category
      })),
      stems: (item.stems || []).map((stem: any) => ({
        id: stem.id?.toString() || '',
        name: stem.Title || 'Untitled Stem', // Changed from title
        url: stem.Audio?.url || '', // Changed structure
        price: Number(stem.Price) || 0, // Changed from price
        duration: Number(stem.Duration) || 0, // Changed from duration
      })),
    };
  } catch (error) {
    console.error(`Error fetching track ${id}:`, error);
    return null;
  }
}

// Return mock data as fallback
function getMockTracks(): Track[] {
  console.log('Returning mock tracks');
  return [
    {
      id: 'mock-1',
      title: 'Demo Track 1',
      bpm: 120,
      duration: 180,
      imageUrl: '',
      audioUrl: '',
      hasStems: true,
      tags: [
        { id: 'tag-1', name: 'Electronic', type: 'genre' },
        { id: 'tag-2', name: 'Energetic', type: 'mood' },
        { id: 'tag-9', name: 'Drums', type: 'instrument' }
      ],
      stems: [
        { id: 'stem-1', name: 'Drums', url: '', price: 9.99, duration: 180 },
        { id: 'stem-2', name: 'Bass', url: '', price: 8.99, duration: 180 }
      ]
    },
    {
      id: 'mock-2',
      title: 'Demo Track 2',
      bpm: 90,
      duration: 210,
      imageUrl: '',
      audioUrl: '',
      hasStems: true,
      tags: [
        { id: 'tag-3', name: 'Hip Hop', type: 'genre' },
        { id: 'tag-4', name: 'Chill', type: 'mood' },
        { id: 'tag-8', name: 'Guitar', type: 'instrument' }
      ],
      stems: [
        { id: 'stem-3', name: 'Vocals', url: '', price: 12.99, duration: 210 },
        { id: 'stem-4', name: 'Beat', url: '', price: 10.99, duration: 210 }
      ]
    },
    {
      id: 'mock-3',
      title: 'Jazzy Vibes',
      bpm: 85,
      duration: 195,
      imageUrl: '',
      audioUrl: '',
      hasStems: true,
      tags: [
        { id: 'tag-5', name: 'Jazz', type: 'genre' },
        { id: 'tag-6', name: 'Relaxed', type: 'mood' },
        { id: 'tag-7', name: 'Piano', type: 'instrument' },
        { id: 'tag-10', name: 'Saxophone', type: 'instrument' }
      ],
      stems: [
        { id: 'stem-5', name: 'Piano', url: '', price: 7.99, duration: 195 },
        { id: 'stem-6', name: 'Saxophone', url: '', price: 8.99, duration: 195 }
      ]
    }
  ];
}

function getMockTags(): Tag[] {
  console.log('Returning mock tags');
  return [
    { id: 'tag-1', name: 'Electronic', type: 'genre' },
    { id: 'tag-3', name: 'Hip Hop', type: 'genre' },
    { id: 'tag-5', name: 'Jazz', type: 'genre' },
    { id: 'tag-2', name: 'Energetic', type: 'mood' },
    { id: 'tag-4', name: 'Chill', type: 'mood' },
    { id: 'tag-6', name: 'Relaxed', type: 'mood' },
    { id: 'tag-7', name: 'Piano', type: 'instrument' },
    { id: 'tag-8', name: 'Guitar', type: 'instrument' },
    { id: 'tag-9', name: 'Drums', type: 'instrument' },
    { id: 'tag-10', name: 'Saxophone', type: 'instrument' }
  ];
}

/**
 * Utility function to print the full Strapi API structure for debugging
 */
export async function printStrapiAPIStructure() {
  if (typeof window === 'undefined') {
    console.log('Running on server - skipping API structure print');
    return;
  }
  
  console.log('Running in browser');
  try {
    const fullUrl = `${API_URL}/api/tracks?populate=*`;
    console.log('Fetching tracks from:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': API_TOKEN ? `Bearer ${API_TOKEN}` : '',
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('API Error:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log(' STRAPI API STRUCTURE:');
    console.log(data);
    
    if (data.data && data.data.length > 0) {
      console.log(' SAMPLE TRACK STRUCTURE:');
      console.log(data.data[0]);
      
      if (data.data[0].tags && data.data[0].tags.length > 0) {
        console.log(' SAMPLE TAG STRUCTURE:');
        console.log(data.data[0].tags[0]);
      }
    }
  } catch (error) {
    console.log('API not available, using mock data instead');
    return null;
  }
}
// Add this function to load the waveform mapping
export async function getWaveformMap() {
  try {
    // Try to fetch the waveform mapping file
    const response = await fetch('/waveforms/waveform-map.json');
    
    if (response.ok) {
      // If successful, parse and return the mapping
      const waveformMap = await response.json();
      return waveformMap;
    }
    
    // If file doesn't exist, return empty object
    return {};
  } catch (error) {
    console.error('Error loading waveform map:', error);
    return {};
  }
}
