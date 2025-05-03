import { NextResponse } from 'next/server';

export async function GET() {
  // Return safe environment variables
  return NextResponse.json({
    strapiUrl: process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api',
    hasToken: !!process.env.NEXT_PUBLIC_STRAPI_API_TOKEN,
    environment: process.env.NODE_ENV
  });
} 