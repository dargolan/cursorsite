import { NextResponse } from 'next/server';
import { API_URL, STRAPI_URL } from '../../../config/strapi';
import { getHeaders } from '../../../services/strapi';

/**
 * API endpoint to list all audio files in Strapi
 * Helps with debugging stem file discovery
 */
export async function GET() {
  try {
    // Query the Strapi uploads endpoint to get all files
    console.log(`[LIST-AUDIO-FILES] Querying Strapi for audio files`);
    
    const response = await fetch(`${API_URL}/upload/files`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      console.error(`[LIST-AUDIO-FILES] Error fetching files: ${response.status}`);
      return NextResponse.json({
        error: `Failed to fetch files: ${response.status}`
      }, { status: response.status });
    }
    
    const files = await response.json();
    
    // Filter to only include audio files and format the response
    const audioFiles = files
      .filter((file: any) => file.mime && file.mime.startsWith('audio/'))
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        url: `${STRAPI_URL}${file.url}`,
        mime: file.mime,
        ext: file.ext,
        size: file.size,
        createdAt: file.createdAt || file.created_at,
        updatedAt: file.updatedAt || file.updated_at
      }));
    
    console.log(`[LIST-AUDIO-FILES] Found ${audioFiles.length} audio files`);
    
    // Group files by likely stems (based on common names)
    const stemGroups: Record<string, any[]> = {};
    const commonStems = ['Drums', 'Bass', 'Keys', 'Guitars', 'Synth', 'Vocals', 'FX', 'Strings', 'Brass'];
    
    commonStems.forEach(stem => {
      stemGroups[stem] = audioFiles.filter((file: any) => 
        file.name.toLowerCase().includes(stem.toLowerCase())
      );
    });
    
    // Also include an "other" category for files not matching known stems
    stemGroups['Other'] = audioFiles.filter((file: any) => 
      !commonStems.some(stem => file.name.toLowerCase().includes(stem.toLowerCase()))
    );
    
    return NextResponse.json({
      total: audioFiles.length,
      audioFiles,
      stemGroups
    });
    
  } catch (error) {
    console.error(`[LIST-AUDIO-FILES] Error:`, error);
    return NextResponse.json({
      error: `Server error: ${(error as Error).message}`
    }, { status: 500 });
  }
} 