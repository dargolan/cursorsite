import { NextResponse } from 'next/server';
import { API_URL, STRAPI_URL } from '../../../config/strapi';
import { getHeaders } from '../../../services/strapi';
import { getCdnDomain } from '../../../utils/cdn-url';

/**
 * API endpoint to find stem URLs
 * Returns the best available URL for the requested stem
 */
export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url);
  const stemName = searchParams.get('name');
  const trackTitle = searchParams.get('track');
  
  if (!stemName || !trackTitle) {
    return NextResponse.json({
      error: 'Missing required parameters: name and track'
    }, { status: 400 });
  }
  
  console.log(`[GET-STEM-URL] Searching for: ${stemName} (${trackTitle})`);
  
  try {
    // First try to find by querying the track in Strapi
    const strapiTrackUrl = `${API_URL}/tracks?filters[title][$containsi]=${encodeURIComponent(trackTitle)}&populate=*`;
    
    const trackResponse = await fetch(strapiTrackUrl, {
      headers: getHeaders()
    });
    
    if (trackResponse.ok) {
      const trackData = await trackResponse.json();
      
      // Ensure we have valid data before trying to access it
      if (trackData?.data?.length > 0) {
        // Handle edge cases with proper null checking
        try {
          // Find best matching track with proper null checking
          const track = trackData.data.find((t: any) => 
            t?.attributes?.title?.toLowerCase() === trackTitle.toLowerCase()
          ) || trackData.data[0];
          
          // Make sure we have a valid track with attributes
          if (track && track.attributes) {
            console.log(`[GET-STEM-URL] Found matching track: ${track.attributes.title || 'Unknown Title'}`);
            
            // Get stems from track, safely handle undefined
            const stems = track.attributes.stems || [];
            
            if (Array.isArray(stems) && stems.length > 0) {
              console.log(`[GET-STEM-URL] Track has ${stems.length} stems`);
              
              // Find matching stem with careful null checking
              const stem = stems.find((s: any) => 
                (s?.name && s.name.toLowerCase() === stemName.toLowerCase()) || 
                (s?.Name && s.Name.toLowerCase() === stemName.toLowerCase())
              );
              
              if (stem) {
                console.log(`[GET-STEM-URL] Found matching stem: ${stem.name || stem.Name || 'Unknown Stem'}`);
                
                // Check if stem has a file or URL
                if (stem.url) {
                  const url = stem.url.startsWith('http') ? stem.url : `${STRAPI_URL}${stem.url}`;
                  return NextResponse.json({ url });
                }
                
                if (stem.file && stem.file.data && stem.file.data.attributes && stem.file.data.attributes.url) {
                  const url = `${STRAPI_URL}${stem.file.data.attributes.url}`;
                  return NextResponse.json({ url });
                }
                
                if (stem.audio && stem.audio.data && stem.audio.data.attributes && stem.audio.data.attributes.url) {
                  const url = `${STRAPI_URL}${stem.audio.data.attributes.url}`;
                  return NextResponse.json({ url });
                }
              }
            }
          }
        } catch (error) {
          console.error(`[GET-STEM-URL] Error accessing track data:`, error);
        }
      }
    }
    
    // If we couldn't find the stem in the track, search in upload files directly
    try {
      const filesResponse = await fetch(`${API_URL}/upload/files`, {
        headers: getHeaders()
      });
      
      if (filesResponse.ok) {
        const files = await filesResponse.json();
        
        // Only look at audio files with proper null checking
        const audioFiles = Array.isArray(files) 
          ? files.filter((f: any) => f?.mime && f.mime.startsWith('audio/'))
          : [];
        
        console.log(`[GET-STEM-URL] Found ${audioFiles.length} audio files in Strapi`);
        
        // Create variations of the stem name and track title to try
        const stemVariants = [
          stemName,
          stemName.toLowerCase(),
          stemName.replace(/\s+/g, '_'),
          stemName.replace(/\s+/g, '-')
        ].filter(Boolean); // Filter out any null/undefined values
        
        const trackVariants = [
          trackTitle,
          trackTitle.toLowerCase(),
          trackTitle.replace(/\s+/g, '_'),
          trackTitle.replace(/\s+/g, '-'),
          trackTitle.split(' ').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('_')
        ].filter(Boolean); // Filter out any null/undefined values
        
        // Look for exact matches first
        for (const file of audioFiles) {
          try {
            const fileName = file.name?.toLowerCase() || '';
            if (!fileName) continue;
            
            // Check if file name contains both stem name and track title
            const matchesStem = stemVariants.some(variant => 
              variant && fileName.includes(variant.toLowerCase()));
            
            const matchesTrack = trackVariants.some(variant => 
              variant && fileName.includes(variant.toLowerCase()));
            
            if (matchesStem && matchesTrack) {
              const url = `${STRAPI_URL}${file.url}`;
              console.log(`[GET-STEM-URL] Found direct match: ${url}`);
              return NextResponse.json({ url });
            }
          } catch (error) {
            console.error(`[GET-STEM-URL] Error processing file:`, error);
            // Continue to next file
          }
        }
        
        // If no exact match, try just matching the stem name
        try {
          const stemMatch = audioFiles.find((f: any) => {
            try {
              const fileName = f?.name?.toLowerCase() || '';
              return fileName && stemVariants.some(variant => 
                variant && fileName.includes(variant.toLowerCase()));
            } catch (e) {
              return false;
            }
          });
          
          if (stemMatch && stemMatch.url) {
            const url = `${STRAPI_URL}${stemMatch.url}`;
            console.log(`[GET-STEM-URL] Found stem name match: ${url}`);
            return NextResponse.json({ url });
          }
        } catch (error) {
          console.error(`[GET-STEM-URL] Error finding stem match:`, error);
        }
      }
    } catch (error) {
      console.error(`[GET-STEM-URL] Error searching files:`, error);
    }
    
    // Look for direct match in CloudFront CDN
    const cdnDomain = getCdnDomain();
    const formattedTrack = trackTitle.replace(/\s+/g, '_');
    const cdnUrl = `https://${cdnDomain}/tracks/795b6819-cdff-4a14-9ea0-95ee9df5fedd/stems/${stemName}_-_${formattedTrack}.mp3`;
    
    console.log(`[GET-STEM-URL] Trying direct CDN URL: ${cdnUrl}`);
    
    // Instead of returning a full URL for mock-stem, return an absolute URL for the mock API
    const baseUrl = new URL(request.url).origin;
    const mockUrl = `${baseUrl}/api/mock-stem?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`;
    
    // Check if the CDN URL is directly accessible
    const headResponse = await fetch(cdnUrl, { method: 'HEAD' }).catch(() => null);
    if (headResponse && headResponse.ok) {
      console.log(`[GET-STEM-URL] CDN URL exists and is accessible: ${cdnUrl}`);
      return NextResponse.json({ url: cdnUrl });
    }
    
    // If no URL was found, return null with an explanation
    console.log(`[GET-STEM-URL] No stem URL found for ${stemName} (${trackTitle})`);
    return NextResponse.json({ 
      url: null,
      message: `No stem URL found for ${stemName} (${trackTitle})`,
      mockUrl
    });
    
  } catch (error) {
    console.error(`[GET-STEM-URL] Error finding stem URL:`, error);
    
    // Ensure we return an absolute URL for the mock API
    const baseUrl = new URL(request.url).origin;
    const mockUrl = `${baseUrl}/api/mock-stem?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`;
    
    return NextResponse.json({
      error: `Failed to find stem URL: ${(error as Error).message}`,
      mockUrl
    }, { status: 500 });
  }
} 