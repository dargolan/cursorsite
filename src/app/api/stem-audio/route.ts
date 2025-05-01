import { NextResponse } from 'next/server';

// Map of stem types to frequencies for simple tones
const STEM_FREQUENCIES: Record<string, number> = {
  'Bass': 80,
  'Drums': 200,
  'Keys': 440,
  'Guitars': 330,
  'Synth': 500,
  'Strings': 600,
  'Brass': 700,
  'FX': 1000,
  'Drones': 150
};

// Length of audio in seconds
const AUDIO_LENGTH = 3;
// Sample rate
const SAMPLE_RATE = 44100;

/**
 * Unified endpoint for all stem audio
 * This avoids all the complexity with proxying and multiple fallbacks
 */
export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url);
  let stemName = searchParams.get('name') || '';
  const trackTitle = searchParams.get('track') || 'Unknown';
  
  console.log(`[STEM-AUDIO] Request for stem: ${stemName}, track: ${trackTitle}`);
  
  // First check if a real stem file exists on CloudFront
  try {
    const CDN_DOMAIN = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'd1r94114aksajj.cloudfront.net';
    // Format the track name consistently for all tracks
    const formattedTrack = trackTitle.replace(/\s+/g, '_');
    
    // Try CloudFront URL with proper formatting
    const cdnUrl = `https://${CDN_DOMAIN}/tracks/795b6819-cdff-4a14-9ea0-95ee9df5fedd/stems/${stemName}_-_${formattedTrack}.mp3`;
    
    console.log(`[STEM-AUDIO] Checking CDN URL: ${cdnUrl}`);
    
    // Check if the CDN URL is accessible
    try {
      const headResponse = await fetch(cdnUrl, { method: 'HEAD' });
      if (headResponse.ok) {
        console.log(`[STEM-AUDIO] Found real audio file, proxying from CDN: ${cdnUrl}`);
        
        // If the real file exists, fetch and return it
        const response = await fetch(cdnUrl);
        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
              'Content-Disposition': `inline; filename="${stemName}_${trackTitle}.mp3"`,
              'Cache-Control': 'public, max-age=3600',
              'Access-Control-Allow-Origin': '*',
              'X-Source': 'CloudFront-Direct'
            }
          });
        }
      }
    } catch (error: any) {
      console.log(`[STEM-AUDIO] Error checking CDN URL: ${error.message}`);
      // Continue to synthetic audio generation
    }
  } catch (error: any) {
    console.error(`[STEM-AUDIO] Error in CDN check:`, error);
    // Continue to synthetic audio fallback
  }
  
  // Fallback: Generate synthetic audio if no real file found
  console.log(`[STEM-AUDIO] No real audio file found, generating synthetic audio for ${stemName}`);
  
  try {
    // Extract just the stem type if it has format like "Drums - Track.mp3"
    let stemType = stemName;
    if (stemName.includes(' - ') || stemName.includes('.mp3')) {
      const parts = stemName.split(/[ -]+/);
      stemType = parts[0]; // Take the first part (Drums, Bass, etc.)
    }
    
    // Normalize stem type
    stemType = stemType.replace(/[^a-zA-Z]/g, '');
    
    // Get frequency for stem type or default to 440 Hz (A note)
    let frequency = 440;
    
    // Find the matching stem type in our frequency map
    for (const [type, freq] of Object.entries(STEM_FREQUENCIES)) {
      if (stemType.toLowerCase().includes(type.toLowerCase())) {
        frequency = freq;
        console.log(`[STEM-AUDIO] Using ${type} sound (${freq}Hz) for ${stemName}`);
        break;
      }
    }
    
    // Generate a basic WAV-like PCM buffer
    const samples = SAMPLE_RATE * AUDIO_LENGTH;
    const buffer = Buffer.alloc(samples * 2); // 16-bit samples = 2 bytes per sample
    
    for (let i = 0; i < samples; i++) {
      // Generate a sine wave
      const value = Math.sin((i / SAMPLE_RATE) * frequency * 2 * Math.PI);
      
      // Add an amplitude envelope (fade in/out)
      const fadeTime = SAMPLE_RATE * 0.1; // 100ms fade in/out
      let amplitude = 0.7; // 70% amplitude to avoid clipping
      
      if (i < fadeTime) {
        // Fade in
        amplitude *= i / fadeTime;
      } else if (i > samples - fadeTime) {
        // Fade out
        amplitude *= (samples - i) / fadeTime;
      }
      
      // Convert to 16-bit value and write to buffer
      const sample = Math.floor(value * amplitude * 32767);
      buffer.writeInt16LE(sample, i * 2);
    }
    
    // Return the buffer as audio/wav
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `inline; filename="${stemName}_${trackTitle}.wav"`,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Generated-By': 'WaveCave-Stem-Audio'
      }
    });
    
  } catch (error) {
    console.error(`[STEM-AUDIO] Error generating audio:`, error);
    return NextResponse.json({
      error: `Failed to generate audio: ${(error as Error).message}`
    }, { status: 500 });
  }
} 