import { Track, Tag, Stem } from '../types';

// Define the base URL for your Strapi API
const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

// Strapi API token - should be in env vars in production
const API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

/**
 * Get all tracks from Strapi
 */
export async function getTracks(): Promise<Track[]> {
  try {
    console.log('API_URL:', API_URL);
    console.log('API_TOKEN:', API_TOKEN ? 'Token exists' : 'No token');
    
    // Check if we're running in browser or server
    if (typeof window !== 'undefined') {
      console.log('Running in browser');
    } else {
      console.log('Running on server');
    }
    
    // Print the API structure for debugging
    if (typeof window !== 'undefined') {
      printStrapiAPIStructure();
    }
    
    // Modified to use public endpoint
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
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Failed to fetch tracks: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw tracks data structure:', Object.keys(data));
    
    // Return mock data if API returns no data
    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.warn('No tracks found in API response, returning mock data');
      return getMockTracks();
    }
    
    console.log(`Received ${data.data.length} tracks from API`);
    console.log('Full track data:', JSON.stringify(data)); // Log full data to debug
    
    // Transform Strapi response to our Track type
    return data.data.map((item: any) => {
      try {
        if (!item) {
          console.warn('Null track item in response');
          return null;
        }
        
        // Fixed: the track data is directly in the item, not in attributes
        // And property names are capitalized in Strapi response
        const track = item; // Changed from item.attributes
        console.log('Processing track:', track.Title); // Changed from track.title
        
        return {
          id: item.id?.toString() || '',
          title: track.Title || 'Untitled Track', // Changed from track.title
          bpm: track.BPM || 120, // Changed from track.bpm
          duration: track.Duration || 0, // Changed from track.duration
          imageUrl: track.Cover?.url || '', // Changed structure to match actual response
          thumbnailImage: track.Cover?.formats?.small?.url || track.Cover?.url || '',
          audioUrl: track.Audio?.url || '', // Changed structure to match actual response
          hasStems: Boolean(track.stems?.length), // Changed from track.stems?.data?.length
          tags: [], // First create with empty tags
          stems: [], // First create with empty stems
        };
      } catch (error) {
        console.error('Error transforming track:', error);
        return null;
      }
    })
    .filter(Boolean)
    .map((track: any) => {
      try {
        // Now find the original item to process tags and stems separately
        const originalItem = data.data.find((i: any) => i.id.toString() === track.id);
        if (!originalItem) return track;
        
        // Process tags directly from the item
        if (Array.isArray(originalItem.tags)) {
          track.tags = originalItem.tags
            .filter((tag: any) => tag && tag.Name)
            .map((tag: any) => ({
              id: tag.id?.toString() || '',
              name: tag.Name || 'Unknown Tag', // Changed from tag.attributes.name
              type: ensureValidType(tag.Category), // Changed from tag.attributes.category
            }));
        }
        
        // Process stems directly from the item
        if (Array.isArray(originalItem.stems)) {
          track.stems = originalItem.stems
            .filter((stem: any) => stem)
            .map((stem: any) => ({
              id: stem.id?.toString() || '',
              name: stem.Title || 'Untitled Stem', // Changed from stem.attributes.title
              url: stem.Audio?.url || '', // Changed to match actual response
              price: Number(stem.Price) || 0, // Changed from stem.attributes.price
              duration: Number(stem.Duration) || 0, // Changed from stem.attributes.duration
            }));
        }
        
        return track;
      } catch (error) {
        console.error('Error processing track relations:', error);
        return track; // Return track even if relations failed
      }
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    console.log('Returning mock data due to error');
    return getMockTracks();
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
    console.error('Error fetching tags:', error);
    console.log('Returning mock data due to error');
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
    console.error('Error fetching API structure:', error);
  }
}