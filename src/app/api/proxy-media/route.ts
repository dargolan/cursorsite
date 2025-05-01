import { NextResponse } from 'next/server';

/**
 * Proxy endpoint for media files to handle CORS issues
 * This proxies requests to CloudFront and adds appropriate CORS headers
 */
export async function GET(request: Request) {
  try {
    // Get the URL to proxy from the query string
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({
        error: 'Missing URL parameter'
      }, { status: 400 });
    }
    
    console.log(`[PROXY-MEDIA] Proxying request to: ${url}`);
    
    // Extract stem name and track title from URL if possible
    let stemName = '';
    let trackTitle = '';
    
    try {
      // Pattern like: "stems/Keys_-_Elevator_music.mp3"
      const stemMatch = url.match(/stems\/([^_]+)_-_([^.]+)\.mp3/);
      if (stemMatch && stemMatch.length >= 3) {
        stemName = stemMatch[1]; // e.g., "Keys"
        trackTitle = stemMatch[2].replace(/_/g, ' '); // e.g., "Elevator music" → "Elevator music"
      }
    } catch (error) {
      console.warn(`[PROXY-MEDIA] Could not extract stem/track info from URL: ${error}`);
    }
    
    // If we determined this is for a stem, use stem-audio endpoint for all tracks
    if (stemName && trackTitle) {
      console.log(`[PROXY-MEDIA] Using stem-audio endpoint for ${stemName} (${trackTitle})`);
      const baseUrl = new URL(request.url).origin;
      const stemAudioUrl = `${baseUrl}/api/stem-audio?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`;
      return NextResponse.redirect(stemAudioUrl);
    }
    
    // For regular media files, make the request to the target URL
    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'WaveCave/1.0',
        'Origin': 'https://wavecave.io',
        'Referer': 'https://wavecave.io/'
      }
    });
    
    if (!response.ok) {
      console.error(`[PROXY-MEDIA] Target returned ${response.status}: ${response.statusText}`);
      
      // If we extracted stem name and track title, we can try the stem-audio API as fallback
      if (stemName && trackTitle) {
        console.log(`[PROXY-MEDIA] Falling back to stem-audio for ${stemName} (${trackTitle})`);
        const baseUrl = new URL(request.url).origin;
        const stemAudioUrl = `${baseUrl}/api/stem-audio?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`;
        
        // Redirect to the stem-audio API
        return NextResponse.redirect(stemAudioUrl);
      }
      
      return NextResponse.json({
        error: `Target returned ${response.status}: ${response.statusText}`
      }, { status: response.status });
    }
    
    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get the response body as an ArrayBuffer
    const data = await response.arrayBuffer();
    
    // Return the response with appropriate headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(data).toString(),
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'X-Proxied-By': 'WaveCave-Media-Proxy'
      }
    });
  } catch (error) {
    console.error(`[PROXY-MEDIA] Error: ${(error as Error).message}`);
    return NextResponse.json({
      error: `Server error: ${(error as Error).message}`
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204, // No content
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
} 