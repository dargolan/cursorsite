import { NextResponse } from 'next/server';

// In-memory store for temporary tracks during development
const tempTracks: any[] = [];

/**
 * API endpoint to create a temporary track when Strapi is unavailable
 * This is a development fallback only!
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Create a temporary track with the data provided
    const tempTrack = {
      id: `temp-${Date.now()}`,
      title: data.title || 'Untitled Track',
      bpm: data.bpm || 0,
      duration: data.duration || 0,
      audioUrl: data.audioUrl || '',
      imageUrl: data.imageUrl || '',
      tags: data.tags || [],
      stems: data.stems || [],
      createdAt: new Date().toISOString(),
      temporary: true
    };
    
    // Add to in-memory store
    tempTracks.push(tempTrack);
    
    console.log(`[api/temp-track] Created temporary track: ${tempTrack.title} (ID: ${tempTrack.id})`);
    console.log(`[api/temp-track] Total temporary tracks: ${tempTracks.length}`);
    
    // Return fake Strapi-like response
    return NextResponse.json({
      data: tempTrack,
      meta: { temporary: true }
    });
  } catch (error: any) {
    console.error('[api/temp-track] Error creating temporary track:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create temporary track', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Get all temporary tracks
 */
export async function GET() {
  return NextResponse.json({
    data: tempTracks,
    meta: { count: tempTracks.length }
  });
} 