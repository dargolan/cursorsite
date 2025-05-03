import { NextRequest, NextResponse } from 'next/server';

/**
 * This is a debugging endpoint that fetches tags directly from Strapi
 * and returns them for comparison with the frontend fetch logic.
 */
export async function GET(request: NextRequest) {
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
  const strapiToken = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';
  
  // Log the request info
  console.log('Debug Tags API called');
  console.log('Strapi URL:', strapiUrl);
  console.log('Has Token:', !!strapiToken);
  
  try {
    // Construct headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (strapiToken) {
      headers['Authorization'] = `Bearer ${strapiToken}`;
    }
    
    // Fetch tags from Strapi
    const tagUrl = `${strapiUrl}/tags?pagination[pageSize]=100`;
    console.log('Fetching tags from:', tagUrl);
    
    const response = await fetch(tagUrl, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi tags fetch failed: ${response.status}`, errorText);
      return NextResponse.json(
        { 
          error: `Strapi error: ${response.status}`,
          message: errorText,
          url: tagUrl,
          headers: headers
        }, 
        { status: response.status }
      );
    }
    
    // Parse the response
    const data = await response.json();
    
    // Process tags like the frontend does
    const tags = data.data?.map((item: any) => {
      const id = item.id?.toString();
      const name = item.name || (item.attributes && item.attributes.name) || 'Unknown';
      const type = item.type || (item.attributes && item.attributes.type) || 'unknown';
      
      return { id, name, type };
    }) || [];
    
    // Return both raw data and processed tags
    return NextResponse.json({
      success: true,
      strapiUrl,
      original: data,
      processedTags: tags,
      tagCounts: {
        total: tags.length,
        byType: tags.reduce((acc: Record<string, number>, tag: any) => {
          acc[tag.type] = (acc[tag.type] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error: any) {
    console.error('Debug tags API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        strapiUrl
      }, 
      { status: 500 }
    );
  }
} 