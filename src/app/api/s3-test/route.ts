import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Bucket name
const bucketName = process.env.AWS_BUCKET_NAME || 'wave-cave-audio';

export async function GET() {
  try {
    // First test - list buckets
    console.log('[S3-TEST] Credentials used:', {
      region: process.env.AWS_REGION || 'eu-north-1',
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      bucket: bucketName
    });
    
    const listBucketsCommand = new ListBucketsCommand({});
    const bucketsResult = await s3Client.send(listBucketsCommand);
    
    // Second test - list objects in the target bucket
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 10, // Just list a few objects
      Prefix: 'tracks/'
    });
    
    const objectsResult = await s3Client.send(listObjectsCommand);
    
    // Return successful response with diagnostics
    return NextResponse.json({
      success: true,
      buckets: bucketsResult.Buckets?.map(bucket => bucket.Name) || [],
      objects: objectsResult.Contents?.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified
      })) || [],
      env: {
        region: process.env.AWS_REGION || 'not set',
        bucket: process.env.AWS_BUCKET_NAME || 'not set',
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  } catch (error: any) {
    console.error('[S3-TEST] Error:', error);
    
    // Return detailed error information
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        name: error.name
      },
      env: {
        region: process.env.AWS_REGION || 'not set',
        bucket: process.env.AWS_BUCKET_NAME || 'not set',
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      }
    }, { status: 500 });
  }
} 