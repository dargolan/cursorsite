import { NextResponse } from 'next/server';

/**
 * Endpoint to serve a placeholder image for tracks with missing/invalid cover art
 * This prevents broken image references in the UI
 */
export async function GET() {
  try {
    // Generate a simple SVG placeholder
    const svgContent = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#333"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#fff" text-anchor="middle" dominant-baseline="middle">
          No Cover Image
        </text>
        <text x="50%" y="65%" font-family="Arial" font-size="18" fill="#aaa" text-anchor="middle" dominant-baseline="middle">
          Placeholder
        </text>
      </svg>
    `;

    // Convert the SVG to a buffer
    const buffer = Buffer.from(svgContent);

    // Return the response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      }
    });
  } catch (error) {
    console.error('[PLACEHOLDER-IMAGE] Error generating placeholder:', error);
    
    return NextResponse.json({
      error: 'Error generating placeholder image'
    }, { status: 500 });
  }
} 