import { NextResponse } from 'next/server';
import { findStemFile } from '../../../services/strapi';
import { STRAPI_URL } from '../../../config/strapi';

// Debug API endpoint to help diagnose stem loading issues
export async function GET(request: Request) {
  // Get the URL and search parameters 
  const { searchParams } = new URL(request.url);
  const stemName = searchParams.get('stemName') || 'Drums';
  const trackTitle = searchParams.get('trackTitle') || 'Elevator Music';
  
  // Log the request details
  console.log(`[DEBUG-STEMS] Looking up stem: ${stemName} for track: ${trackTitle}`);
  
  // Array to hold all the debug info
  const debugInfo = {
    timestamp: new Date().toISOString(),
    request: {
      stemName,
      trackTitle
    },
    results: {} as any
  };
  
  // Try to get the stem URL using the Strapi API
  try {
    const strapiStemUrl = await findStemFile(stemName, trackTitle);
    debugInfo.results.strapiStemUrl = strapiStemUrl;
    debugInfo.results.strapiStemUrlFound = !!strapiStemUrl;
  } catch (error) {
    debugInfo.results.strapiError = (error as Error).message;
  }
  
  // Try various URL patterns following our universal format
  const possibleUrls = [
    // API endpoints
    `/api/stem-audio?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`,
    `/api/generate-stem?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`,
    `/api/mock-stem?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`,
    
    // Generic Strapi pattern
    `${STRAPI_URL}/uploads/${stemName}_${trackTitle.replace(/ /g, '_')}.mp3`,
  ];
  
  debugInfo.results.possibleUrls = possibleUrls;
  
  // Return all the debug info
  return NextResponse.json(debugInfo);
} 