import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get filename from query parameters
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }
    
    // Source file (silent audio)
    const sourceFile = path.join(process.cwd(), 'public', 'audio', 'dummy-silent.mp3');
    
    // Ensure source file exists
    if (!fs.existsSync(sourceFile)) {
      return NextResponse.json(
        { error: 'Source silent audio file not found' },
        { status: 404 }
      );
    }
    
    // Target directory (create if not exists)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Target file path
    const targetFile = path.join(uploadsDir, filename);
    
    // Copy the file
    fs.copyFileSync(sourceFile, targetFile);
    
    return NextResponse.json({
      success: true,
      message: `Created dummy file: ${filename}`,
      path: `/uploads/${filename}`
    });
  } catch (error) {
    console.error('Error creating dummy file:', error);
    return NextResponse.json(
      { error: 'Failed to create dummy file' },
      { status: 500 }
    );
  }
} 