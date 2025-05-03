import { NextResponse } from 'next/server';

/**
 * API endpoint that returns a placeholder SVG image with WaveCave branding
 * Used when a cover image is not available
 */
export async function GET(request: Request) {
  // Generate a simple SVG placeholder with WaveCave branding
  const width = 300;
  const height = 300;
  const bgColor = '#1E1E1E';
  const textColor = '#1DF7CE'; // WaveCave accent color
  
  // Create SVG with WaveCave branding
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" font-family="Inter, Arial, sans-serif" font-size="32" 
            fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
        WaveCave
      </text>
      <text x="50%" y="65%" font-family="Inter, Arial, sans-serif" font-size="14" 
            fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
        Image not available
      </text>
    </svg>
  `;
  
  // Return SVG with appropriate headers
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    }
  });
} 