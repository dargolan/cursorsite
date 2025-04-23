import fs from 'fs';
import path from 'path';

/**
 * Ensures the uploads directory exists
 */
export function ensureUploadsDirectory(): string {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  return uploadsDir;
}

/**
 * Gets a formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Validate file type
 */
export function validateFileType(file: File, acceptedTypes: string[] = ['audio/mpeg', 'audio/wav', 'audio/mp3']): boolean {
  return acceptedTypes.includes(file.type);
}

/**
 * Get file extension from mime type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    // Audio
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/flac': 'flac',
    'audio/ogg': 'ogg',
    
    // Images
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  
  // If mime type is unknown, try to guess from file extension
  return mimeToExt[mimeType] || 'bin';
}

/**
 * Get common image formats
 */
export function getAcceptedImageTypes(): string[] {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
}

/**
 * Get common audio formats
 */
export function getAcceptedAudioTypes(): string[] {
  return ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
} 