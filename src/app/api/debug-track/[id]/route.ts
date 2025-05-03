import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

/**
 * Debug endpoint to directly fetch track data from Strapi
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }
  
  try {
    console.log(`[DEBUG-TRACK] Attempting to fetch track with ID: ${id}`);
    
    // Build correct API URL
    const apiUrl = STRAPI_URL.endsWith('/api') 
      ? STRAPI_URL 
      : `${STRAPI_URL}/api`;
    
    // Try both methods of finding the track
    const responses = await Promise.all([
      // Method 1: Find by trackId field
      fetch(`${apiUrl}/tracks?filters[trackId][$eq]=${encodeURIComponent(id)}&populate=*`, {
        headers: {
          'Content-Type': 'application/json',
          ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {})
        }
      }),
      
      // Method 2: Find by direct ID
      fetch(`${apiUrl}/tracks/${encodeURIComponent(id)}?populate=*`, {
        headers: {
          'Content-Type': 'application/json',
          ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {})
        }
      })
    ]);
    
    const results = await Promise.all(
      responses.map(async (res, index) => {
        try {
          const data = await res.json();
          return {
            method: index === 0 ? 'byTrackId' : 'byDirectId',
            status: res.status,
            statusText: res.statusText,
            success: res.ok,
            data: data
          };
        } catch (err) {
          return {
            method: index === 0 ? 'byTrackId' : 'byDirectId',
            status: res.status,
            statusText: res.statusText,
            success: false,
            error: 'Failed to parse response'
          };
        }
      })
    );
    
    // Add environment info
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        strapiUrl: STRAPI_URL,
        hasToken: !!STRAPI_TOKEN,
        nodeEnv: process.env.NODE_ENV
      },
      results
    };
    
    return NextResponse.json(debugInfo);
  } catch (error: any) {
    console.error('[DEBUG-TRACK] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch track data',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 