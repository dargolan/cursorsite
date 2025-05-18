import { NextResponse } from 'next/server';
import { STRAPI_URL } from '../../../config/strapi';

// --- Begin normalization dependencies ---
const S3_DOMAIN = process.env.NEXT_PUBLIC_S3_DOMAIN || 'wave-cave-audio.s3.eu-north-1.amazonaws.com';
const CDN_DOMAIN = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'd1r94114aksajj.cloudfront.net';

function toCdnUrl(url: string): string {
  if (!url) return '';
  if (url.includes(CDN_DOMAIN)) return url;
  if (url.includes(S3_DOMAIN)) {
    return url.replace(S3_DOMAIN, CDN_DOMAIN);
  }
  return url;
}

function getProxiedMediaUrl(url: string): string {
  if (!url) return '';
  const cdnUrl = toCdnUrl(url);
  if (/^https?:\/\//.test(cdnUrl)) return cdnUrl;
  return cdnUrl;
}

function normalizeTrack(strapiTrack: any) {
  try {
    const data = strapiTrack.attributes || strapiTrack;
    const trackId = strapiTrack.id?.toString() || '';
    
    // Validate required fields
    if (!trackId) {
      console.error('[normalizeTrack] Missing track ID:', strapiTrack);
      throw new Error('Missing track ID');
    }
    
    const trackTitle = data.title || data.Title || 'Unknown Track';
    let audioUrl = data.audioUrl || '';
    let imageUrl = data.imageUrl || data.ImageUrl || '';
    
    // Validate URLs
    if (!audioUrl) {
      console.warn(`[normalizeTrack] Missing audio URL for track ${trackId}`);
    }
    if (!imageUrl) {
      console.warn(`[normalizeTrack] Missing image URL for track ${trackId}`);
    }
    
    // Process tags with validation
    let tags: any[] = [];
    if (data.tags && Array.isArray(data.tags)) {
      tags = data.tags.map((tag: any) => {
        if (!tag.id) {
          console.warn(`[normalizeTrack] Tag missing ID for track ${trackId}`);
          return null;
        }
        return {
        id: tag.id.toString(),
        name: tag.Name || tag.name || 'Unknown Tag',
        type: tag.type || 'genre'
        };
      }).filter(Boolean);
    }
    
    // Process stems with validation
    const stems = Array.isArray(data.stems)
      ? data.stems.map((stem: any, idx: number) => ({
          id: stem.id?.toString() || `stem-${idx}`,
          name: stem.name || 'Unknown Stem',
          wavUrl: stem.wavUrl || '',
          mp3Url: stem.mp3Url || '',
          price: Number(stem.price) || 0,
          duration: Number(stem.duration) || 0
        }))
      : [];
    
    // Validate numeric fields
    const bpm = Number(data.bpm || data.BPM) || 0;
    const duration = Number(data.duration || data.Duration) || 0;
    
    if (bpm < 0) {
      console.warn(`[normalizeTrack] Invalid BPM value ${bpm} for track ${trackId}`);
    }
    if (duration < 0) {
      console.warn(`[normalizeTrack] Invalid duration value ${duration} for track ${trackId}`);
    }
    
    return {
      id: trackId,
      title: trackTitle,
      bpm,
      duration,
      tags,
      stems,
      hasStems: stems.length > 0,
      audioUrl: toCdnUrl(audioUrl),
      imageUrl: toCdnUrl(imageUrl),
      waveform: data.waveform || []
    };
  } catch (error) {
    console.error('[normalizeTrack] Error normalizing track:', error);
    return {
      id: strapiTrack?.id?.toString() || 'error',
      title: 'Error Loading Track',
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
// --- End normalization dependencies ---

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  // Validate pagination parameters
  if (page < 1) {
    return NextResponse.json({ error: 'Invalid page number' }, { status: 400 });
  }
  if (pageSize < 1 || pageSize > 100) {
    return NextResponse.json({ error: 'Invalid page size' }, { status: 400 });
  }

  try {
    console.log(`[GET /api/tracks] Fetching page ${page} with size ${pageSize}`);
    
    const response = await fetch(
      `${STRAPI_URL}/api/tracks?pagination[page]=${page}&pagination[pageSize]=${pageSize}&populate=*`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[GET /api/tracks] Strapi API returned ${response.status}`);
      throw new Error(`Strapi API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data?.data || !Array.isArray(data.data)) {
      console.error('[GET /api/tracks] Invalid response structure:', data);
      throw new Error('Invalid response structure from Strapi');
    }

    // Normalize tracks with error handling
    const tracks = data.data.map((track: any) => {
      try {
        return normalizeTrack(track);
      } catch (error) {
        console.error('[GET /api/tracks] Error normalizing track:', error);
        return null;
      }
    }).filter(Boolean);

    // Log success
    console.log(`[GET /api/tracks] Successfully processed ${tracks.length} tracks`);
    
    return NextResponse.json({ 
      tracks,
      pagination: {
        page,
        pageSize,
        total: data.meta?.pagination?.total || tracks.length
      }
    });
  } catch (error) {
    console.error('[GET /api/tracks] Error fetching tracks:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tracks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 