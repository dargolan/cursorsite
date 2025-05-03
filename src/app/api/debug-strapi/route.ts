import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get configuration values
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
    const strapiToken = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';
    
    console.log('Strapi debug check...');
    console.log('Strapi URL:', strapiUrl);
    console.log('Has token:', !!strapiToken);
    
    // Test various Strapi endpoints
    const endpoints = [
      { name: 'Base API', url: strapiUrl },
      { name: 'Tags', url: `${strapiUrl}/tags` },
      { name: 'Tracks', url: `${strapiUrl}/tracks` }
    ];
    
    const results = [];
    
    // Prepare headers for Strapi requests
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (strapiToken) {
      headers['Authorization'] = `Bearer ${strapiToken}`;
    }
    
    // Test each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint.url}`);
        
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers,
          cache: 'no-store'
        });
        
        const status = response.status;
        const statusText = response.statusText;
        const isSuccess = response.ok;
        let data;
        
        try {
          data = await response.json();
        } catch (e) {
          data = { error: 'Failed to parse JSON response' };
        }
        
        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status,
          statusText,
          isSuccess,
          data: isSuccess ? data : null,
          error: !isSuccess ? data : null
        });
        
        console.log(`Result for ${endpoint.name}: ${status} ${statusText}`);
      } catch (error: any) {
        console.error(`Error testing ${endpoint.name}:`, error);
        
        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: 0,
          statusText: 'Connection Error',
          isSuccess: false,
          error: {
            message: error.message || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }
        });
      }
    }
    
    // Try creating a test track to verify write access
    const createTestResult = await testTrackCreation(strapiUrl, strapiToken);
    
    // Return diagnostic information
    return NextResponse.json({
      strapi: {
        url: strapiUrl,
        hasToken: !!strapiToken,
        isOnline: results.some(r => r.endpoint === 'Tags' && r.isSuccess)
      },
      serverInfo: {
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      endpointTests: results,
      createTest: createTestResult
    });
  } catch (error: any) {
    console.error('Strapi debug error:', error);
    
    return NextResponse.json({
      error: true,
      message: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

async function testTrackCreation(strapiUrl: string, strapiToken: string) {
  try {
    console.log('Testing track creation...');
    
    // Create a minimal test track
    const testTrack = {
      data: {
        title: `Test Track ${new Date().toISOString()}`,
        bpm: 120,
        trackId: `test-${Date.now()}`,
        audioUrl: 'http://example.com/test.mp3',
        imageUrl: 'http://example.com/test.jpg'
      }
    };
    
    // Set up headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (strapiToken) {
      headers['Authorization'] = `Bearer ${strapiToken}`;
    }
    
    // Make the request
    const response = await fetch(`${strapiUrl}/tracks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testTrack)
    });
    
    const status = response.status;
    const statusText = response.statusText;
    const isSuccess = response.ok;
    
    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = { error: 'Failed to parse JSON response' };
    }
    
    return {
      status,
      statusText,
      isSuccess,
      requestBody: testTrack,
      responseData: responseData
    };
  } catch (error: any) {
    console.error('Error testing track creation:', error);
    
    return {
      status: 0,
      statusText: 'Connection Error',
      isSuccess: false,
      error: {
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };
  }
} 