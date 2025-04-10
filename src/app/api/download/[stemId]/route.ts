import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Base Strapi URL
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_MEDIA_URL || 'http://localhost:1337';
const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

// Fetch helper for Strapi API calls
async function queryStrapi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
  
  // Create headers with authentication if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
    ...options.headers
  };
  
  // Build the complete URL
  const url = `${API_URL}${endpoint}`;
  
  console.log(`Making request to Strapi: ${url}`);
  
  return fetch(url, {
    ...options,
    headers
  });
}

export async function GET(
  request: Request,
  { params }: { params: { stemId: string } }
) {
  try {
    // Get the stem ID from route params
    const { stemId } = params;

    if (!stemId) {
      return NextResponse.json(
        { error: 'Missing stem ID' },
        { status: 400 }
      );
    }

    // Get authentication token from request (either from cookies or auth header)
    const cookieStore = cookies();
    const authCookie = cookieStore.get('auth_token');
    const token = authCookie?.value;
    
    // Get auth token from header if not in cookie
    const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '');
    const userId = request.headers.get('X-User-Id') || 'anonymous';
    
    // Get query parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    const downloadToken = url.searchParams.get('token');

    // Check for required authentication
    if (!token && !authHeader && !sessionId && !downloadToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the user has purchased this stem
    const hasAccess = await verifyPurchaseAccess(stemId, userId, sessionId, downloadToken);
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied. You have not purchased this stem.' },
        { status: 403 }
      );
    }

    // Fetch the stem details from Strapi
    const stemDetails = await fetchStemDetails(stemId);
    
    if (!stemDetails || !stemDetails.url) {
      return NextResponse.json(
        { error: 'Stem not found or has no associated file' },
        { status: 404 }
      );
    }

    // For secure downloads, we'll redirect to a signed URL instead of proxying
    // This helps with large file downloads and reduces server load
    const downloadUrl = await generateSecureDownloadUrl(stemDetails.url, stemDetails.name);
    
    if (downloadUrl) {
      // Redirect to the secure download URL with appropriate Content-Disposition headers
      return NextResponse.redirect(downloadUrl);
    } else {
      // Fallback: Proxy the file download through our server
      return await proxyFileDownload(stemDetails.url, stemDetails.name);
    }
  } catch (error: any) {
    console.error('Error processing download request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process download request' },
      { status: 500 }
    );
  }
}

/**
 * Verify if the user has purchased access to this stem
 */
async function verifyPurchaseAccess(
  stemId: string, 
  userId: string,
  sessionId?: string | null,
  downloadToken?: string | null
): Promise<boolean> {
  try {
    // If we have a session ID from a recent purchase, verify it first
    if (sessionId) {
      // Verify the Stripe session directly
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/verify-purchase?session_id=${sessionId}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Check the metadata to see if it matches our stem ID
        const sessionMetadata = data.session?.metadata;
        if (sessionMetadata && sessionMetadata.stemId === stemId) {
          return true;
        }
      }
    }

    // If we have a download token, verify it
    if (downloadToken) {
      const isValidToken = verifyDownloadToken(downloadToken, stemId);
      if (isValidToken) {
        return true;
      }
    }

    // Check Strapi for purchase records
    const response = await queryStrapi(`/api/stem-access?filters[stemId][$eq]=${stemId}&filters[userId][$eq]=${userId}`);

    if (!response.ok) {
      console.error('Failed to verify purchase:', await response.text());
      return false;
    }

    const data = await response.json();
    
    // Check if any purchase records exist
    return data && Array.isArray(data.data) && data.data.length > 0;
  } catch (error) {
    console.error('Error verifying purchase access:', error);
    return false;
  }
}

/**
 * Verify a download token
 */
function verifyDownloadToken(token: string, stemId: string): boolean {
  try {
    // Simple token verification logic
    // In a real implementation, use a JWT or similar with proper signing
    const [encodedData, signature] = token.split('.');
    
    if (!encodedData || !signature) {
      return false;
    }
    
    const data = JSON.parse(Buffer.from(encodedData, 'base64').toString('utf-8'));
    
    // Check if token is expired
    if (data.exp && data.exp < Date.now()) {
      return false;
    }
    
    // Check if token is for this stem
    if (data.stemId !== stemId) {
      return false;
    }
    
    // In a real implementation, verify the signature
    // Here we're just doing a basic check
    return true;
  } catch (error) {
    console.error('Error verifying download token:', error);
    return false;
  }
}

/**
 * Fetch stem details from Strapi
 */
async function fetchStemDetails(stemId: string): Promise<{ url: string; name: string } | null> {
  try {
    // First try to fetch from the stems API
    const response = await queryStrapi(`/api/stems/${stemId}?populate=audio`);

    if (!response.ok) {
      console.error('Failed to fetch stem details:', await response.text());
      
      // Fallback to tracks API to find the stem
      // This is needed because stems might be nested within tracks
      const tracksResponse = await queryStrapi('/api/tracks?populate=stems.audio');
      
      if (!tracksResponse.ok) {
        return null;
      }
      
      const tracksData = await tracksResponse.json();
      
      // Search for the stem in all tracks
      let stemUrl = null;
      let stemName = '';
      
      if (tracksData && tracksData.data) {
        for (const track of tracksData.data) {
          if (track.attributes && track.attributes.stems) {
            const foundStem = track.attributes.stems.data.find(
              (stem: any) => stem.id === stemId || `${track.id}-stem-${stem.id}` === stemId
            );
            
            if (foundStem && foundStem.attributes) {
              stemUrl = foundStem.attributes.audio?.data?.attributes?.url || null;
              stemName = foundStem.attributes.name || `Stem ${stemId}`;
              break;
            }
          }
        }
      }
      
      if (!stemUrl) {
        return null;
      }
      
      return {
        url: stemUrl,
        name: stemName
      };
    }

    const data = await response.json();
    
    if (!data || !data.data || !data.data.attributes) {
      return null;
    }
    
    const attributes = data.data.attributes;
    const audioUrl = attributes.audio?.data?.attributes?.url;
    
    if (!audioUrl) {
      return null;
    }
    
    return {
      url: audioUrl,
      name: attributes.name || `Stem ${stemId}`
    };
  } catch (error) {
    console.error('Error fetching stem details:', error);
    return null;
  }
}

/**
 * Generate a secure download URL for the file
 */
async function generateSecureDownloadUrl(fileUrl: string, fileName: string): Promise<string | null> {
  try {
    // In a real implementation, you might generate a signed URL with AWS S3 or similar
    // For this example, we'll just return a fully qualified URL
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    // If it's a relative URL, prepend the Strapi URL
    return `${STRAPI_URL}${fileUrl}`;
  } catch (error) {
    console.error('Error generating secure download URL:', error);
    return null;
  }
}

/**
 * Proxy the file download through our server
 */
async function proxyFileDownload(fileUrl: string, fileName: string): Promise<NextResponse> {
  try {
    // Construct the full URL if it's a relative path
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${STRAPI_URL}${fileUrl}`;
    
    // Fetch the file
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    // Get the file data
    const data = await response.arrayBuffer();
    
    // Get content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Return the file with appropriate headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': response.headers.get('content-length') || '',
      },
    });
  } catch (error) {
    console.error('Error proxying file download:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
    },
  });
} 