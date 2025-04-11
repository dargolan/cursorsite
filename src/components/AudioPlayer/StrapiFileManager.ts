import { STRAPI_URL } from '@/services/strapi';

interface StemFile {
  fileName: string;
  url: string;
  stemName: string;
  hash: string | null;
}

interface TrackFiles {
  [trackName: string]: StemFile[];
}

export class StrapiFileManager {
  private static instance: StrapiFileManager;
  private stemNames = ['Drums', 'Bass', 'Keys', 'Guitars', 'Synth', 'Strings', 'FX', 'Brass'];

  private constructor() {}

  static getInstance(): StrapiFileManager {
    if (!StrapiFileManager.instance) {
      StrapiFileManager.instance = new StrapiFileManager();
    }
    return StrapiFileManager.instance;
  }

  async listAllFiles(): Promise<TrackFiles> {
    try {
      const apiUrl = `${STRAPI_URL}/api/upload/files`;
      console.log(`[DEBUG] Fetching all files from Strapi: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`);
      }

      const files = await response.json();
      console.log(`[DEBUG] Found ${files.length} files in Strapi uploads`);
      
      return this.organizeFiles(files);
    } catch (error) {
      console.error('Error listing Strapi files:', error);
      throw error;
    }
  }

  private organizeFiles(files: any[]): TrackFiles {
    const stemFiles: TrackFiles = {};
    
    files.forEach((file: any) => {
      const fileName = file.name.toLowerCase();
      const url = `${STRAPI_URL}${file.url}`;
      
      // Log each file with its URL
      console.log(`[DEBUG] File: ${file.name} -> ${url}`);
      
      // Try to identify which track it belongs to
      this.stemNames.forEach(stemName => {
        const stemPattern = new RegExp(`${stemName.toLowerCase()}_(.+?)(?:_[a-z0-9]+)?\.mp3`, 'i');
        const match = fileName.match(stemPattern);
        
        if (match) {
          const trackName = this.formatTrackName(match[1]);
          
          if (!stemFiles[trackName]) {
            stemFiles[trackName] = [];
          }
          
          stemFiles[trackName].push({
            fileName: file.name,
            url,
            stemName,
            hash: fileName.match(/_([a-z0-9]+)\.mp3$/)?.[1] || null
          });
        }
      });
    });

    // Log organized files
    Object.entries(stemFiles).forEach(([track, files]) => {
      console.log(`[DEBUG] Track "${track}": ${files.length} stem files`);
      files.forEach(file => {
        console.log(`[DEBUG]   - ${file.stemName}: ${file.fileName} -> ${file.url}`);
      });
    });

    return stemFiles;
  }

  private formatTrackName(rawName: string): string {
    return rawName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getHashMapForTrack(files: StemFile[]): Record<string, string> {
    const hashMap: Record<string, string> = {};
    
    files.forEach(file => {
      if (file.hash) {
        hashMap[file.stemName] = file.hash;
      }
    });
    
    return hashMap;
  }
}

export const strapiFileManager = StrapiFileManager.getInstance(); 