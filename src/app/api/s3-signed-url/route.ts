import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Log environment variables for debugging (redacted secrets)
console.log('[S3-SETUP] Environment:', {
  AWS_REGION: process.env.AWS_REGION || 'not set',
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || 'not set',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'set (redacted)' : 'not set',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'set (redacted)' : 'not set',
});

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Bucket name
const bucketName = process.env.AWS_BUCKET_NAME || 'wave-cave-audio';

/**
 * Test S3 access by listing buckets
 */
async function testS3Access() {
  try {
    console.log('[S3-TEST] Testing S3 access by listing buckets...');
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log('[S3-TEST] S3 access successful! Buckets available:', 
      response.Buckets?.map(b => b.Name).join(', '));
    return true;
  } catch (error) {
    console.error('[S3-TEST] S3 access test failed:', error);
    return false;
  }
}

// Test S3 access on startup
testS3Access();

/**
 * Generate a signed URL for S3 objects
 * @route POST /api/s3-signed-url
 */
export async function POST(request: NextRequest) {
  try {
    // Get the object path from the request body
    const { path } = await request.json();
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }
    
    console.log('[S3-SIGNED] Generating signed URL for path:', path);
    console.log('[S3-SIGNED] Using bucket:', bucketName);
    
    // Test S3 access first
    const hasAccess = await testS3Access();
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'No S3 access - check AWS credentials',
        details: {
          hasRegion: !!process.env.AWS_REGION,
          hasBucket: !!process.env.AWS_BUCKET_NAME,
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
        }
      }, { status: 500 });
    }
    
    // Create S3 command
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: path,
    });
    
    // Generate signed URL with expiration (15 minutes)
    const signedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 15 * 60 // 15 minutes
    });
    
    console.log('[S3-SIGNED] Generated URL:', signedUrl);
    
    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    console.error('[S3-SIGNED] Error:', error);
    
    // Return more detailed error information
    return NextResponse.json({
      error: error.message || 'Error generating signed URL',
      code: error.code,
      name: error.name,
      details: {
        hasRegion: !!process.env.AWS_REGION,
        hasBucket: !!process.env.AWS_BUCKET_NAME,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      }
    }, { status: 500 });
  }
}

/**
 * Return supported HTTP methods
 * @route OPTIONS /api/s3-signed-url
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
} 