# Remaining Stem System Cleanup Tasks

This document outlines the remaining work needed to complete the stem system cleanup.

## Completed Tasks (June-July 2025)

✅ **Simplified Audio Managers**
- Removed all stem-specific code and events from `src/lib/audio-manager.ts`
- Removed stem functionality from `src/lib/unified-audio-manager.ts`
- Eliminated stemId references, stem events, and stem-specific methods
- Changed `unifiedAudioManager` export to `getUnifiedAudioManager` getter function

✅ **Simplified AudioPlayer Component**
- Created a new simplified `SimplifiedAudioPlayer.tsx` without stem functionality
- Preserved original implementation in `AudioPlayer.original.tsx` for reference
- Updated main `AudioPlayer.tsx` to re-export the simplified version

✅ **StemContainer and StemData Updates**
- Updated `src/components/stem/StemContainer.tsx` to use a consistent approach for all tracks
- Updated `src/hooks/useStemData.ts` to remove track-specific handling and excessive logging
- Updated `src/services/strapi.ts` to use generic fallback stems without hardcoded audio URLs

✅ **Media Helpers Cleanup**
- Updated `src/utils/media-helpers.ts` to ensure consistent URL handling for all tracks
- Modified functions to use track IDs consistently rather than titles in paths

✅ **New API Endpoints**
- Implemented the stem-audio API endpoint with proper S3/CloudFront integration
- Used a consistent URL pattern for all stems: `/api/stem-audio?trackId={trackId}&stemId={stemId}`
- Removed all track-specific handling in favor of a unified approach

## Components Requiring Cleanup

### 1. ~~AudioPlayer.tsx~~ (COMPLETED)
- ~~Remove all stem-related event listeners and state variables~~
- ~~Remove stem playback functions (handleStemPlayPause)~~
- ~~Remove stem UI elements and event handlers~~
- ~~Simplify the audio manager references~~

### 2. ~~StemContainer.tsx~~ (COMPLETED)
- ~~This component currently has placeholders but still needs a complete reimplementation~~
- ~~Consider simplifying to just display stems without audio playback for now~~

## Services and Utilities

### 1. ~~Audio Managers~~ (COMPLETED)
- ~~`src/lib/audio-manager.ts` - Remove all stem-specific code and events~~
- ~~`src/lib/unified-audio-manager.ts` - Remove stem functionality~~

### 2. Upload Flow
- The upload page has been updated to remove stem upload UI, but backend handling may still need review
- Ensure API routes handle the new simplified stem data structure

## Types

### 1. Stem Interface
- The Stem interface in types.ts has been marked for reimplementation
- It currently remains minimal with just id, name, price, and duration fields
- Will need to evolve as the new stem system is implemented

## API Endpoints

### 1. New Endpoints
- Implement the new stem-audio endpoint for consistent stem URL handling:
  ```typescript
  // src/app/api/stem-audio/route.ts
  export async function GET(request: Request) {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');
    const stemId = searchParams.get('stemId');
    
    // Validate required parameters
    if (!trackId || !stemId) {
      return NextResponse.json({
        error: 'Missing required parameters. Both trackId and stemId are required.'
      }, { status: 400 });
    }
    
    // ... implementation details
  }
  ```

## Next Steps

1. Verify that the SimplifiedAudioPlayer works correctly with all tracks
2. Test the stem playback in StemContainer with the new URL scheme
3. Update documentation to reflect the final architecture

## Reference

See the original STEM_CLEANUP.md for the changes that have already been implemented. 