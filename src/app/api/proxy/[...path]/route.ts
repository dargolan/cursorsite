import { NextRequest, NextResponse } from 'next/server';
import { STRAPI_URL } from '../../../../services/strapi';

// Default CORS headers for audio requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle OPTIONS requests (CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Proxy GET requests to Strapi media
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    console.log(`[PROXY] Proxying request for: ${path}`);

    // Get the base Strapi media URL
    const strapiMediaUrl = STRAPI_URL;
    
    // Determine the target URL based on the path
    let targetUrl: string;

    if (path.startsWith('uploads/')) {
      // Direct uploads path
      targetUrl = `${strapiMediaUrl}/${path}`;
    } else {
      // Assume it's already a complete path
      targetUrl = `${strapiMediaUrl}/${path}`;
    }

    console.log(`[PROXY] Fetching from: ${targetUrl}`);

    // Fetch the resource from Strapi
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'audio/*,*/*',
      },
    });

    if (!response.ok) {
      console.error(`[PROXY] Error fetching: ${targetUrl}, status: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch resource: ${response.statusText}` },
        { status: response.status, headers: corsHeaders }
      );
    }

    // Get the data as an array buffer for binary file types
    const data = await response.arrayBuffer();

    // Get the content-type from the original response
    const contentType = response.headers.get('content-type') || 'audio/mpeg';

    // Return the proxied response with CORS headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Length': response.headers.get('content-length') || '',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('[PROXY] Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500, headers: corsHeaders }
    );
  }
} 