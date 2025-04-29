import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';
import { ensureUploadsDirectory, validateFileType, getExtensionFromMimeType } from '@/lib/upload-helpers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string || 'main';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type based on fileType
    let validTypes: string[];
    if (fileType === 'image') {
      validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    } else {
      validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    }
    
    if (!validateFileType(file, validTypes)) {
      const formatList = fileType === 'image' 
        ? 'JPEG, PNG, WebP, GIF' 
        : 'MP3, WAV';
        
      return NextResponse.json(
        { error: `Invalid file type. Only ${formatList} files are allowed.` },
        { status: 400 }
      );
    }

    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get or generate trackId
    let trackId = formData.get('trackId') as string | null;
    if (!trackId) {
      trackId = uuidv4();
    }

    // Create unique filename and S3 key
    const originalName = file.name;
    let extension: string;
    let s3Key: string;
    let filename: string;
    if (fileType === 'image') {
      extension = file.name.split('.').pop() || 'jpg';
      filename = `cover.${extension}`;
      s3Key = `tracks/${trackId}/${filename}`;
    } else if (fileType === 'main') {
      extension = getExtensionFromMimeType(file.type);
      filename = `main.${extension}`;
      s3Key = `tracks/${trackId}/${filename}`;
    } else {
      extension = getExtensionFromMimeType(file.type);
      filename = `${originalName.replace(/\s+/g, '_')}`;
      s3Key = `tracks/${trackId}/stems/${filename}`;
    }

    // Upload file to S3
    const s3Url = await uploadToS3(buffer, s3Key, file.type);

    // Return response with file details and trackId
    return NextResponse.json({
      success: true,
      trackId,
      filename,
      originalName,
      size: file.size,
      url: s3Url,
      fileType
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Error uploading file' },
      { status: 500 }
    );
  }
} 