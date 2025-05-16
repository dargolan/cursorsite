import { NextRequest, NextResponse } from 'next/server';

// Get Strapi API URL and token from env
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // data should include: title, bpm, duration, tags, stems, audioUrl, imageUrl, trackId, etc.

    // Prepare payload for Strapi (all lowercase field names)
    const payload = {
      data: {
        title: data.title,
        bpm: data.bpm,
        duration: data.duration,
        audioUrl: data.audioUrl,
        imageUrl: data.imageUrl,
        stems: data.stems,
        trackId: data.trackId,
        tags: data.tags, // send as array of IDs if that's what Strapi expects
      }
    };

    // Call Strapi REST API to create the track
    const res = await fetch(`${STRAPI_URL}/api/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Strapi error:', errorText); // Log Strapi error
      return NextResponse.json({ error: `Strapi error: ${res.status} - ${errorText}` }, { status: 500 });
    }

    const responseData = await res.json();
    return NextResponse.json({ success: true, track: responseData });
  } catch (error: any) {
    console.error('API route error:', error); // Log API route error
    return NextResponse.json({ error: error.message || 'Error creating track' }, { status: 500 });
  }
} 