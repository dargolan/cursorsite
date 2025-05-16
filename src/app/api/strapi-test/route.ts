import { NextResponse } from 'next/server';
import { STRAPI_URL, API_URL, API_TOKEN } from '@/config/strapi';

/**
 * Test endpoint to diagnose Strapi connection issues
 */
export async function GET() {
  try {
    // Test fetching tags to check connection
    console.log('[api/strapi-test] Testing Strapi connection');
    
    // Create headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`;
    }
    
    // Try a simple GET request first
    const tagsResponse = await fetch(`${API_URL}/tags?pagination[pageSize]=1`, {
      headers,
      cache: 'no-store'
    });
    
    // Check permissions with the /users/me endpoint
    let permissionsData = null;
    try {
      const permissionsResponse = await fetch(`${API_URL}/users/me?populate=role`, {
        headers,
        cache: 'no-store'
      });
      
      if (permissionsResponse.ok) {
        permissionsData = await permissionsResponse.json();
      } else {
        console.error(`[api/strapi-test] Error fetching permissions: ${permissionsResponse.status}`);
      }
    } catch (permError) {
      console.error('[api/strapi-test] Error checking permissions:', permError);
    }
    
    // Return the diagnostics results
    return NextResponse.json({
      strapiUrl: STRAPI_URL,
      apiUrl: API_URL,
      hasToken: !!API_TOKEN,
      tagsStatus: tagsResponse.status,
      tagsOk: tagsResponse.ok,
      permissions: permissionsData,
      tests: {
        canConnect: tagsResponse.ok,
        hasValidToken: !!permissionsData,
        likelyCreatePermission: permissionsData?.role?.type === 'admin' || 
          permissionsData?.role?.name === 'Editor' || permissionsData?.role?.name === 'Author'
      },
      recommendations: []
    });
  } catch (error) {
    console.error('[api/strapi-test] Error testing Strapi connection:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Strapi connection', 
        details: (error as Error).message,
        strapiUrl: STRAPI_URL,
        apiUrl: API_URL,
        hasToken: !!API_TOKEN
      },
      { status: 500 }
    );
  }
} 