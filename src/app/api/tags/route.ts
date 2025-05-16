import { NextResponse } from 'next/server';
import { getTags } from '@/services/strapi';

/**
 * API endpoint to get all tags from Strapi
 */
export async function GET() {
  try {
    console.log('[api/tags] Fetching tags');
    const tags = await getTags();
    
    if (!tags || tags.length === 0) {
      console.warn('[api/tags] No tags found or error fetching tags');
    } else {
      console.log(`[api/tags] Successfully retrieved ${tags.length} tags`);
    }
    
    return NextResponse.json(tags);
  } catch (error) {
    console.error('[api/tags] Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags', details: (error as Error).message },
      { status: 500 }
    );
  }
} 