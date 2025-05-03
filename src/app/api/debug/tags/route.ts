import { NextResponse } from 'next/server';
import { API_URL } from '../../../../config/strapi';

export async function GET() {
  try {
    console.log('==== DEBUG TAGS API ENDPOINT ====');
    console.log('Debug: Fetching tags directly from Strapi API');
    console.log('API_URL configured as:', API_URL);
    
    // Log the full URL we're requesting
    const url = `${API_URL}/tags?populate=*&pagination[pageSize]=100`;
    console.log('Request URL:', url);
    
    // Make the request with proper headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    console.log('Request headers:', JSON.stringify(headers));
    
    console.log('Sending fetch request...');
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });
    
    // Log response status
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Safe way to log headers without using iterators that might cause TypeScript issues
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('Response headers:', JSON.stringify(responseHeaders));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      return NextResponse.json({ error: `Error fetching tags: ${response.status}`, details: errorText }, { status: response.status });
    }
    
    // Parse and return the data
    console.log('Response OK, parsing JSON...');
    const data = await response.json();
    console.log('Data received, item count:', data?.data?.length || 0);
    
    // Sample the first tag for debugging
    if (data?.data?.length > 0) {
      console.log('First tag sample:', JSON.stringify(data.data[0], null, 2));
    } else {
      console.log('No tags found in response');
    }
    
    // Count tags by type
    const tags = data?.data?.map((tag: any) => ({
      id: tag.id.toString(),
      name: tag.name || 'Unknown Tag',
      type: tag.type || 'genre'
    })) || [];
    
    console.log('Processed tags sample:', tags.slice(0, 3));
    
    const counts = {
      total: tags.length,
      genre: tags.filter((tag: any) => tag.type === 'genre').length,
      mood: tags.filter((tag: any) => tag.type === 'mood').length,
      instrument: tags.filter((tag: any) => tag.type === 'instrument').length,
      other: tags.filter((tag: any) => !['genre', 'mood', 'instrument'].includes(tag.type)).length
    };
    
    console.log('Tag counts by type:', JSON.stringify(counts));
    console.log('==== END DEBUG TAGS API ENDPOINT ====');
    
    return NextResponse.json({
      success: true,
      counts,
      tags,
      rawData: data
    });
  } catch (error) {
    console.error('Error in debug tags endpoint:', error);
    return NextResponse.json({ error: 'Failed to fetch tags', details: (error as Error).message }, { status: 500 });
  }
} 