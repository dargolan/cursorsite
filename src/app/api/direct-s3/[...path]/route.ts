import { NextRequest, NextResponse } from 'next/server';
import { STRAPI_URL } from '../../../../config/strapi';

// CORS headers for media files
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * API endpoint for redirecting to Strapi media URLs
 * This is a simplified replacement for the direct-s3 endpoint
 * since we now fully rely on Strapi for media files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path;
  
  // Log the request path
  console.log(`[api/direct-s3] Legacy request for: ${path.join('/')}`);
  
  // Return a response explaining that direct-s3 is no longer supported
  return NextResponse.json({
    error: 'The direct-s3 API endpoint is no longer supported. All media should come directly from Strapi.',
    message: 'Please update your code to use Strapi media URLs directly.',
    requestedPath: path.join('/')
  }, {
    status: 410, // Gone
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    }
  });
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}