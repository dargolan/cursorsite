import { NextResponse } from 'next/server';

// Base Strapi URL
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_MEDIA_URL || 'http://localhost:1337';
const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

// Fetch helper for Strapi API calls
async function queryStrapi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
  
  // Create headers with authentication if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
    ...options.headers
  };
  
  // Build the complete URL
  const url = `${API_URL}${endpoint}`;
  
  console.log(`Making request to Strapi: ${url}`);
  
  return fetch(url, {
    ...options,
    headers
  });
}

export async function GET(
  request: Request,
  { params }: { params: { stemId: string } }
) {
  try {
    // Get the stem ID from route params
    const { stemId } = params;

    if (!stemId) {
      return NextResponse.json(
        { error: 'Missing stem ID' },
        { status: 400 }
      );
    }

    // Fetch the stem details
    const stemDetails = await fetchStemDetails(stemId);
    
    if (!stemDetails) {
      return NextResponse.json(
        { error: 'Stem not found' },
        { status: 404 }
      );
    }

    // Return the stem details
    return NextResponse.json(stemDetails);
  } catch (error: any) {
    console.error('Error fetching stem details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stem details' },
      { status: 500 }
    );
  }
}

/**
 * Fetch stem details from Strapi
 */
async function fetchStemDetails(stemId: string): Promise<any | null> {
  try {
    // First try to fetch from the stems API
    const response = await queryStrapi(`/api/stems/${stemId}?populate=audio,track`);

    if (!response.ok) {
      console.error('Failed to fetch stem details:', await response.text());
      
      // Fallback to tracks API to find the stem
      // This is needed because stems might be nested within tracks
      const tracksResponse = await queryStrapi('/api/tracks?populate=stems');
      
      if (!tracksResponse.ok) {
        return null;
      }
      
      const tracksData = await tracksResponse.json();
      
      // Search for the stem in all tracks
      let stemDetails = null;
      if (tracksData && tracksData.data) {
        for (const track of tracksData.data) {
          if (track.attributes && track.attributes.stems) {
            const foundStem = track.attributes.stems.data.find(
              (stem: any) => stem.id === stemId || `${track.id}-stem-${stem.id}` === stemId
            );
            
            if (foundStem) {
              // Return stem details with track information
              stemDetails = {
                id: stemId,
                name: foundStem.attributes.name || `Stem ${stemId}`,
                trackId: track.id,
                trackName: track.attributes.title || 'Unknown Track',
                url: foundStem.attributes.audio?.data?.attributes?.url || null,
                price: foundStem.attributes.price || 0
              };
              break;
            }
          }
        }
      }
      
      return stemDetails;
    }

    const data = await response.json();
    
    if (!data || !data.data) {
      return null;
    }
    
    // Extract stem and track details
    const stem = data.data;
    const attributes = stem.attributes || {};
    const track = attributes.track?.data?.attributes || {};
    
    return {
      id: stemId,
      name: attributes.name || `Stem ${stemId}`,
      trackId: attributes.track?.data?.id || '',
      trackName: track.title || 'Unknown Track',
      url: attributes.audio?.data?.attributes?.url || null,
      price: attributes.price || 0
    };
  } catch (error) {
    console.error('Error fetching stem details:', error);
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 