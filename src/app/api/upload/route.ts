import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
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

    // Create unique filename
    const originalName = file.name;
    let extension: string;
    let prefix: string;
    
    if (fileType === 'image') {
      extension = file.name.split('.').pop() || 'jpg';
      prefix = 'cover_';
    } else {
      extension = getExtensionFromMimeType(file.type);
      prefix = fileType === 'main' ? 'main_' : 'stem_';
    }
    
    const uniqueFilename = `${prefix}${uuidv4()}.${extension}`;

    // Create appropriate directory structure
    const uploadsDir = ensureUploadsDirectory();
    const filepath = join(uploadsDir, uniqueFilename);

    // Save file to disk
    await writeFile(filepath, buffer);

    // Return response with file details
    return NextResponse.json({
      success: true,
      filename: uniqueFilename,
      originalName,
      size: file.size,
      url: `/uploads/${uniqueFilename}`,
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