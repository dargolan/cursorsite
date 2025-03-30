import { Track, Tag, Stem } from '../types';

// Define the base URL for your Strapi API
const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

/**
 * Get all tracks from Strapi
 */
export async function getTracks(): Promise<Track[]> {
  try {
    const response = await fetch(`${API_URL}/api/tracks?populate=*`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tracks');
    }
    
    const data = await response.json();
    
    // Transform Strapi response to our Track type
    return data.data.map((item: any) => {
      const track = item.attributes;
      
      return {
        id: item.id.toString(),
        title: track.title,
        bpm: track.bpm,
        duration: track.duration || 0,
        imageUrl: track.cover?.data?.attributes?.url || '',
        audioUrl: track.audio?.data?.attributes?.url || '',
        hasStems: track.stems?.data?.length > 0,
        tags: track.tags?.data?.map((tag: any) => ({
          id: tag.id.toString(),
          name: tag.attributes.name,
          type: tag.attributes.category,
        })) || [],
        stems: track.stems?.data?.map((stem: any) => ({
          id: stem.id.toString(),
          name: stem.attributes.title,
          url: stem.attributes.audio?.data?.attributes?.url || '',
          price: stem.attributes.price || 0,
          duration: 0, // This would be calculated or stored in your Strapi
        })) || [],
      };
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }
}

/**
 * Get all tags from Strapi
 */
export async function getTags(): Promise<Tag[]> {
  try {
    const response = await fetch(`${API_URL}/api/tags`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }
    
    const data = await response.json();
    
    // Transform Strapi response to our Tag type
    return data.data.map((item: any) => {
      const tag = item.attributes;
      
      return {
        id: item.id.toString(),
        name: tag.name,
        type: tag.category,
      };
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

/**
 * Get a single track by ID with its stems
 */
export async function getTrack(id: string): Promise<Track | null> {
  try {
    const response = await fetch(`${API_URL}/api/tracks/${id}?populate=*`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch track ${id}`);
    }
    
    const data = await response.json();
    const item = data.data;
    const track = item.attributes;
    
    return {
      id: item.id.toString(),
      title: track.title,
      bpm: track.bpm,
      duration: track.duration || 0,
      imageUrl: track.cover?.data?.attributes?.url || '',
      audioUrl: track.audio?.data?.attributes?.url || '',
      hasStems: track.stems?.data?.length > 0,
      tags: track.tags?.data?.map((tag: any) => ({
        id: tag.id.toString(),
        name: tag.attributes.name,
        type: tag.attributes.category,
      })) || [],
      stems: track.stems?.data?.map((stem: any) => ({
        id: stem.id.toString(),
        name: stem.attributes.title,
        url: stem.attributes.audio?.data?.attributes?.url || '',
        price: stem.attributes.price || 0,
        duration: 0,
      })) || [],
    };
  } catch (error) {
    console.error(`Error fetching track ${id}:`, error);
    return null;
  }
} 