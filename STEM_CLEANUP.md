# Stem Code Cleanup Document

This document outlines all the hardcoded track-specific elements that need to be removed from the codebase as part of the cleanup process.

## Files Already Cleaned

The following files have been cleaned up and committed:

1. `src/utils/audio-helpers.ts` - Removed all track-specific hash lookups and simplified to use the unified stem-audio endpoint
2. `src/utils/stem-cache.ts` - Removed track-specific validation logic

## Files That Need Cleaning

### 1. src/components/AudioPlayer.tsx

This file contains numerous hardcoded track-specific elements that need to be removed:

```javascript
// Remove all of these track-specific hash constants
const ELEVATOR_MUSIC_STEM_HASHES: Record<string, string> = { ... };
const CRAZY_MEME_MUSIC_STEM_HASHES: Record<string, string> = { ... };
const LOFI_BEATS_STEM_HASHES: Record<string, string> = { ... };
const DRAMATIC_EPIC_CINEMA_STEM_HASHES: Record<string, string> = { ... };
const DIRECT_CLOUDFRONT_URLS: Record<string, Record<string, string>> = { ... };
const MOCK_STEM_URLS: Record<string, Record<string, string>> = { ... };

// Remove these track-specific functions
function getHash(stemName: string, trackTitle: string): string { ... }
function fallbackGetStemUrl(stemName: string, trackTitle: string): string { ... }
```

Replace the `getStemUrl` function with a simpler version that only uses the stem-audio endpoint:

```javascript
function getStemUrl(stemName: string, trackTitle: string): string {
  // Try to get from cache first
  const cacheKey = `${trackTitle}:${stemName}`;
  if (stemUrlCache[cacheKey]) {
    return stemUrlCache[cacheKey];
  }
  
  // Use the unified stem-audio endpoint
  const stemAudioUrl = `/api/stem-audio?name=${encodeURIComponent(stemName)}&track=${encodeURIComponent(trackTitle)}`;
  stemUrlCache[cacheKey] = stemAudioUrl; // Cache it
  return stemAudioUrl;
}
```

Modify functions that reference the old hardcoded variables and functions:
- Fix references to `getHash`
- Fix references to `fallbackGetStemUrl`
- Update any code that does track-specific branching (like `if (trackTitle.toLowerCase() === 'elevator music')`)
- Make sure to change any references from `globalAudioManager` to `audioManager`

### 2. src/hooks/useStemPlayer.ts

Look for and remove track-specific handling:

```javascript
// Lines like these would need to be removed
if (trackLower.includes('elevator') && filename.includes('elevator_music')) {
  // ...
}
else if (trackLower.includes('crazy meme') && filename.includes('crazy_meme_music')) {
  // ...
}
```

### 3. src/components/stem/StemItem.tsx

Remove similar track-specific checks:

```javascript
// Lines like these would need to be removed
if (track.title.toLowerCase().includes('elevator') && filename.includes('elevator_music')) {
  // ...
}
else if (track.title.toLowerCase().includes('crazy meme') && filename.includes('crazy_meme_music')) {
  // ...
}
```

### 4. src/app/debug/page.tsx

Remove hardcoded CloudFront URL checks and other track-specific validations:

```javascript
// Remove code like this
if (stemName === 'Keys' && trackTitle === 'Elevator Music') {
  const directUrl = 'https://d1r94114aksajj.cloudfront.net/tracks/795b6819-cdff-4a14-9ea0-95ee9df5fedd/stems/Keys_-_Elevator_music.mp3';
  // ...
}
```

## Implementation Strategy

1. Update each file separately to ensure that changes don't break other parts of the system
2. For complex components like AudioPlayer.tsx, consider creating a new simplified version and then replacing the old one
3. Test each component after changes to ensure stem playback works consistently for all tracks 