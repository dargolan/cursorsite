import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('==== DIRECT STRAPI TEST ====');
    
    // Use direct fetch to Strapi without any configuration
    const baseUrl = 'http://localhost:1337';
    const url = `${baseUrl}/api/tags?populate=*&pagination[pageSize]=100`;
    console.log('Requesting URL:', url);
    
    // Very basic request with minimal headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      return NextResponse.json({ 
        error: `Error fetching tags: ${response.status}`, 
        details: errorText 
      }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('Data received, item count:', data?.data?.length || 0);
    
    return NextResponse.json({
      success: true,
      url,
      tagCount: data?.data?.length || 0,
      data
    });
  } catch (error) {
    console.error('Error in direct test endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tags directly', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 