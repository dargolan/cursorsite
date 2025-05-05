import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3, checkFileExists } from '@/lib/s3';
import { v4 as uuidv4 } from 'uuid';
import { validateFileType, getExtensionFromMimeType, getTrackFolderName, getS3Key } from '@/lib/upload-helpers';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for better upload performance

// Store temporary file paths for chunked uploads
const chunkUploads: Record<string, {
  filePath: string, 
  fileType: string,
  fileName: string,
  originalName: string,
  size: number,
  chunks: number,
  completedChunks: number,
  lastUpdated: Date
}> = {};

// Clean old uploads every hour (if server has been running that long)
setInterval(() => {
  const now = new Date();
  Object.entries(chunkUploads).forEach(([uploadId, data]) => {
    // Remove if older than 24 hours
    if (now.getTime() - data.lastUpdated.getTime() > 24 * 60 * 60 * 1000) {
      // Delete the temp file
      try {
        if (fs.existsSync(data.filePath)) {
          fs.unlinkSync(data.filePath);
        }
      } catch (err) {
        console.error('Error cleaning up temp file:', err);
      }
      // Remove from tracking
      delete chunkUploads[uploadId];
    }
  });
}, 60 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string || 'main';
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = formData.get('chunkIndex');
    const totalChunks = formData.get('totalChunks');
    
    // Check if this is a chunked upload
    if (uploadId && chunkIndex !== null && totalChunks !== null) {
      return handleChunkedUpload(formData, uploadId, parseInt(chunkIndex as string), parseInt(totalChunks as string));
    }
    
    // Regular upload (small file)
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
      validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/flac'];
    }
    
    if (!validateFileType(file, validTypes)) {
      const formatList = fileType === 'image' 
        ? 'JPEG, PNG, WebP, GIF' 
        : 'MP3, WAV, FLAC';
        
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

    // Get track metadata for folder naming
    const trackTitle = formData.get('trackTitle') as string | null;
    const artistName = formData.get('artistName') as string | null;
    
    // Generate folder name using the track title
    const folderName = getTrackFolderName(
      trackTitle || '', 
      trackId,
      artistName || undefined
    );

    // Create unique filename and S3 key
    const originalName = file.name;
    let extension: string;
    let filename: string;
    let s3Key: string;
    
    if (fileType === 'image') {
      extension = file.name.split('.').pop() || 'jpg';
      filename = `cover.${extension}`;
      s3Key = getS3Key(folderName, fileType, filename);
    } else if (fileType === 'main') {
      extension = getExtensionFromMimeType(file.type);
      filename = `main.${extension}`;
      s3Key = getS3Key(folderName, fileType, filename);
    } else {
      extension = getExtensionFromMimeType(file.type);
      filename = `${originalName.replace(/\s+/g, '_')}`;
      s3Key = getS3Key(folderName, 'stem', filename);
    }

    // Upload file to S3
    try {
      const s3Url = await uploadToS3(buffer, s3Key, file.type);
      
      // Verify upload was successful by checking if file exists
      const fileExists = await checkFileExists(s3Key);
      if (!fileExists) {
        console.error('Upload verification failed: File not found on storage server');
        return NextResponse.json(
          { error: 'Upload verification failed. File not found on storage server.' },
          { status: 500 }
        );
      }
      
      // Return response with file details and trackId
      return NextResponse.json({
        success: true,
        trackId,
        filename,
        originalName,
        size: file.size,
        url: s3Url,
        fileType,
        folderName // Return the folder name for reference
      });
    } catch (s3Error: any) {
      console.error('S3 upload error:', s3Error);
      
      // Provide more specific error messages based on error type
      if (s3Error.code === 'CredentialsError' || s3Error.message?.includes('credentials')) {
        return NextResponse.json(
          { error: 'AWS credentials are missing or invalid. Please check your environment variables.' },
          { status: 500 }
        );
      }
      
      if (s3Error.code === 'NoSuchBucket') {
        return NextResponse.json(
          { error: 'S3 bucket does not exist. Please check your configuration.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `S3 upload failed: ${s3Error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Error uploading file' },
      { status: 500 }
    );
  }
}

// Handle chunked uploads for large files
async function handleChunkedUpload(
  formData: FormData, 
  uploadId: string, 
  chunkIndex: number, 
  totalChunks: number
) {
  try {
    const chunk = formData.get('file') as File;
    const trackId = formData.get('trackId') as string;
    const fileType = formData.get('fileType') as string;
    const originalFileName = formData.get('originalFileName') as string;
    const totalFileSize = parseInt(formData.get('totalFileSize') as string);
    const trackTitle = formData.get('trackTitle') as string || '';
    const artistName = formData.get('artistName') as string || '';
    
    if (!chunk) {
      return NextResponse.json({ error: 'No chunk provided' }, { status: 400 });
    }
    
    // Get the chunk data
    const bytes = await chunk.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Initialize upload tracking if it's the first chunk
    if (chunkIndex === 0 || !chunkUploads[uploadId]) {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(os.tmpdir(), 'wave-cave-uploads');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Create a temp file to store chunks
      const tempFilePath = path.join(tempDir, `${uploadId}`);
      
      chunkUploads[uploadId] = {
        filePath: tempFilePath,
        fileType,
        fileName: '',  // Will be set after all chunks are received
        originalName: originalFileName,
        size: totalFileSize,
        chunks: totalChunks,
        completedChunks: 0,
        lastUpdated: new Date()
      };
      
      // Create an empty file
      fs.writeFileSync(tempFilePath, Buffer.alloc(0));
    }
    
    // Update the upload tracking
    const uploadData = chunkUploads[uploadId];
    uploadData.lastUpdated = new Date();
    
    // Write this chunk to the temp file
    const fileHandle = fs.openSync(uploadData.filePath, 'r+');
    fs.writeSync(fileHandle, buffer, 0, buffer.length, chunkIndex * CHUNK_SIZE);
    fs.closeSync(fileHandle);
    
    // Update progress
    uploadData.completedChunks++;
    
    // If all chunks received, finalize the upload
    if (uploadData.completedChunks === totalChunks) {
      // Determine the file type and name
      let extension = originalFileName.split('.').pop() || '';
      if (!extension) {
        extension = getExtensionFromMimeType(chunk.type);
      }
      
      // Sanitize filename
      const safeFileName = originalFileName.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_');
      
      // Generate proper folder name with track title
      const folderName = getTrackFolderName(trackTitle, trackId, artistName);
      
      // Create S3 key based on file type
      let s3Key: string;
      let filename: string;
      if (fileType === 'image') {
        filename = `cover.${extension}`;
        s3Key = getS3Key(folderName, fileType, filename);
      } else if (fileType === 'main') {
        filename = `main.${extension}`;
        s3Key = getS3Key(folderName, fileType, filename);
      } else {
        filename = safeFileName;
        s3Key = getS3Key(folderName, 'stem', filename);
      }
      
      uploadData.fileName = filename;
      
      // Read the complete file
      const fileBuffer = fs.readFileSync(uploadData.filePath);
      
      // Upload to S3
      const s3Url = await uploadToS3(fileBuffer, s3Key, chunk.type);
      
      // Verify upload
      const fileExists = await checkFileExists(s3Key);
      if (!fileExists) {
        return NextResponse.json(
          { error: 'Upload verification failed. File not found on storage server.' },
          { status: 500 }
        );
      }
      
      // Clean up the temp file
      try {
        fs.unlinkSync(uploadData.filePath);
      } catch (err) {
        console.error('Error cleaning up temp file:', err);
      }
      
      // Remove from tracking
      delete chunkUploads[uploadId];
      
      // Return success with file details
      return NextResponse.json({
        success: true,
        trackId,
        filename,
        originalName: originalFileName,
        size: totalFileSize,
        url: s3Url,
        fileType,
        chunked: true,
        chunks: totalChunks,
        folderName // Return the folder name for reference
      });
    }
    
    // Return progress for chunk
    return NextResponse.json({
      success: true,
      uploadId,
      chunkIndex,
      progress: (uploadData.completedChunks / totalChunks) * 100,
      completedChunks: uploadData.completedChunks,
      totalChunks,
      complete: false
    });
    
  } catch (error: any) {
    console.error('Chunk upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing chunk upload' },
      { status: 500 }
    );
  }
} 