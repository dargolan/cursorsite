import { Track, Tag } from '@/types';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

interface CreateTrackData {
  title: string;
  bpm: number;
  duration: number;
  waveform: number[];
  audioUrl: string;
  imageUrl: string;
  stems: {
    name: string;
    url: string;
    duration: number;
    waveform: number[];
  }[];
  tags: string[]; // Tag IDs
}

export async function createTrack(data: CreateTrackData): Promise<Track> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create track: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating track in Strapi:', error);
    throw error;
  }
}

export async function getTags(): Promise<Tag[]> {
  try {
    const response = await fetch(`${STRAPI_URL}/api/tags`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching tags from Strapi:', error);
    throw error;
  }
} 