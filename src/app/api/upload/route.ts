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

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    if (!validateFileType(file, validTypes)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP3 and WAV files are allowed.' },
        { status: 400 }
      );
    }

    // Get file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const originalName = file.name;
    const extension = getExtensionFromMimeType(file.type);
    
    // Add prefix based on file type
    const prefix = fileType === 'main' ? 'main_' : 'stem_';
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