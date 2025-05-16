import { NextResponse } from 'next/server';
import { createTrackNoAuth } from '@/services/strapi';

/**
 * API endpoint to create a track in Strapi without authentication
 * For public access where auth is not required/available
 */
export async function POST(request: Request) {
  try {
    // Get the data from the request
    const data = await request.json();
    
    // Log what we're trying to create
    console.log('[api/tracks/create-noauth] Creating track without auth:', data.title || 'Unknown Track');
    
    // Call Strapi to create the track without authentication
    const result = await createTrackNoAuth(data);
    
    // Return the created track
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[api/tracks/create-noauth] Error creating track:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create track', 
        details: error.message,
        path: '/api/tracks/create-noauth'
      },
      { status: 500 }
    );
  }
} 