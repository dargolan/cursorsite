import { TrackMetadata, StemMetadata } from './audio-metadata-extractor';

interface CreateTrackParams {
  title: string;
  metadata: TrackMetadata;
  imageUrl: string;
  audioUrl: string;
  stems: {
    name: string;
    url: string;
  }[];
  tags: string[];
}

/**
 * Creates a new track in Strapi with the simplified metadata structure
 */
export async function createTrackInStrapi(params: CreateTrackParams) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/tracks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        Title: params.title,
        BPM: params.metadata.bpm || 120,
        Duration: params.metadata.duration,
        Image: params.imageUrl,
        AudioPreview: params.audioUrl,
        tags: params.tags,
        stems: params.stems.map(stem => ({
          Name: stem.name,
          Audio: stem.url,
          // We'll set a default price that can be updated in Strapi admin
          Price: 4.99
        })),
        // Store waveform data in a custom field
        waveformData: params.metadata.waveform,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create track: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Migrates an existing track to the new metadata structure
 */
export async function migrateTrackMetadata(trackId: string, metadata: TrackMetadata) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/tracks/${trackId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: {
        Duration: metadata.duration,
        BPM: metadata.bpm || 120,
        waveformData: metadata.waveform,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to migrate track: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Gets all tracks for migration
 */
export async function getTracksNeedingMigration() {
  try {
    console.log('Fetching all tracks...');
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/tracks?populate[AudioPreview][fields][0]=url&populate[AudioPreview][fields][1]=name`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get tracks: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw Strapi response:', JSON.stringify(data, null, 2));

    // Validate the response structure
    if (!data?.data || !Array.isArray(data.data)) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response structure from API');
    }

    // Log each track's structure
    data.data.forEach((track: any, index: number) => {
      console.log(`Track ${index + 1}:`, {
        id: track.id,
        title: track.attributes?.Title,
        audioPreview: track.attributes?.AudioPreview?.data?.attributes?.url
      });
    });
    
    return {
      data: data.data || []
    };
  } catch (error) {
    console.error('Error in getTracksNeedingMigration:', error);
    throw error;
  }
}

/**
 * Utility to check if a track needs migration
 */
export function doesTrackNeedMigration(track: any): boolean {
  return !track.waveformData || track.Duration === undefined || track.BPM === undefined;
} 