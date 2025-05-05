# WaveCave Audio Platform

A platform for distributing audio tracks created exclusively by Wave Cave, where users can download free music and (in the future) purchase stems and premium tracks.

## Project Overview

### Design & UI
- **Theme**: Dark, sleek interface with a clean aesthetic
- **Colors**:
  - Background: #1E1E1E
  - Hover/Active: #232323
  - Accent: #1DF7CE (neon turquoise)
  - Text: White (#FFFFFF)
  - Secondary Text: #CDCDCD
- **Typography**: Inter font family
- **Layout**: Responsive design with left-side filtering menu and main content area

### Core Features
1. **Audio Player System**
   - Scalable design supporting hundreds to thousands of instances
   - Lazy loading implementation for performance optimization
   - Components:
     - Track image with play/pause overlay
     - Title and BPM display
     - Tag system with filtering capability
     - Waveform visualization (initially progress bar)
     - Duration display
     - Stems dropdown
     - Download functionality

2. **Filtering System**
   - Left-side menu with:
     - Search functionality
     - Genre, Mood, and Instrument filters
     - BPM and Duration range sliders
     - Hierarchical tag system with parent/child relationships

3. **Content Distribution**
   - Free track downloads
   - Premium track purchases (future feature)
   - Stem purchases (future feature)
   - Shopping cart functionality
   - User authentication for purchases

4. **Content Management**
   - Automated track and stem upload system
   - Metadata extraction
   - Tag management
   - Analytics tracking

[... existing documentation content ...]

## Audio Player Technical Documentation

### Overview
The WaveCave audio player is designed as a minimalist, high-performance component for playing music tracks while providing essential playback controls and visual feedback. The player focuses on clean aesthetics with dark backgrounds, teal accents, and intuitive controls.

### Visual Design

#### Layout Structure
The audio player uses a card-based design with the following hierarchy:
- Outer container: Dark background (#1E1E1E) with rounded corners and bottom margin
- Two main sections: 
  1. Header section with track info and controls
  2. Progress section with interactive waveform/progress bar

#### Color Scheme
- Background: #1E1E1E (dark gray card background)
- Secondary background: #282828 (for image placeholder, tags, progress bar)
- Accent: #1DF7CE (teal, used for progress marker and interactive elements)
- Text: White for titles, #CDCDCD for tags

#### Typography
- Track title: bold, 18px (text-lg), white
- Tags: 12px (text-xs), #CDCDCD
- Time display: 12px (text-xs), gray-400

### Component Architecture

#### Component Hierarchy
```
AudioPlayer
├── TrackHeader
│   ├── TrackImage
│   │   └── PlayButton
│   ├── TrackInfo
│   │   └── TagList
│   └── Controls
└── ProgressSection
    ├── ProgressBar
    └── TimeDisplay
```

#### File Structure
- `src/components/AudioPlayer/AudioPlayer.tsx`: Main component implementation
- `src/components/AudioPlayer/PlayButton.tsx`: Reusable play/pause button
- `src/hooks/useAudioPlayer.ts`: Custom hook for audio playback logic
- `src/utils/audio-url-manager.ts`: URL resolution and caching
- `src/lib/audio-manager.ts`: Global audio state management

### Implementation Details

#### State Management
The AudioPlayer manages several state variables:
- `trackUrl`: String URL of the audio file to play (null until loaded)
- `isUrlLoading`: Boolean flag for URL loading state
- Additional state via `useAudioPlayer` hook:
  - `isPlaying`: Current playback state 
  - `duration`: Total track duration in seconds
  - `currentTime`: Current playback position in seconds
  - `isLoading`: Audio loading state
  - `error`: Any error during audio loading/playback

#### Initialization Flow
1. Component mounts with track data
2. `useEffect` hook attempts to load track URL:
   - Uses track's audioUrl directly if available
   - Otherwise calls `findTrackAudioUrl` to discover URL
3. Upon URL resolution, `useAudioPlayer` hook initializes audio element
4. Audio element loads metadata and prepares for playback

#### Audio Source Resolution
The `findTrackAudioUrl` function uses a sophisticated resolution strategy:
1. Check cache first to avoid redundant network requests
2. Look for sample track in public directory (e.g., `/sample-tracks/track_name.mp3`)
3. Try multiple URL patterns across various base paths
4. Fallback to proxy endpoint as last resort

#### Playback Control
The player implements a centralized playback system through:
1. `globalAudioController`: Prevents multiple simultaneous playback
2. `audioManager`: Tracks currently playing audio and dispatches events
3. Local state management via the `useAudioPlayer` hook

#### Event Handling
- `onPlay`/`onStop`: Propagate playback state to parent components
- `onTagClick`: Handle tag selection for filtering
- Progress bar click: Seek to position
- Time updates: Sync UI with playback position

### Interactive Elements

#### Track Image and Play Button
- 64×64px (w-16 h-16) image with rounded corners
- PlayButton overlay with play/pause toggle
- Visual loading state for both URL and audio loading

#### Progress Bar
- Full-width, height 48px (h-12) 
- Background color: #282828
- Progress fill: Semi-transparent teal (#1DF7CE/20)
- Vertical position marker: Solid teal line (#1DF7CE)
- Click to seek functionality

#### Time Display
- Shows current time and total duration
- Format: M:SS (e.g., "2:30")
- Gray text color for subtle appearance

### Performance Optimizations

#### Audio Loading
- Loading states to provide visual feedback
- Error handling with console logging
- Cache audio URLs in localStorage
- Configurable autoplay support

#### Event Handling
- Debounced time updates (250ms intervals)
- Efficient cleanup of resources
- Proper unsubscribe from event listeners

#### React Optimizations
- `useCallback` for stable event handlers
- Clean effect cleanup
- Single source of truth for playback state

### Code Example

```tsx
// Progress bar implementation with seek functionality
<div 
  className="w-full h-12 bg-[#282828] rounded-md relative cursor-pointer" 
  onClick={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    seek(percentage * duration);
  }}
>
  {/* Simple progress bar */}
  <div 
    className="h-full bg-[#1DF7CE]/20 absolute left-0 top-0"
    style={{ width: `${(currentTime / duration) * 100}%` }}
  />
  {/* Progress marker */}
  <div 
    className="absolute top-0 w-0.5 h-full bg-[#1DF7CE]"
    style={{ left: `${(currentTime / duration) * 100}%` }}
  />
</div>
```

### Future Enhancement Considerations

#### Planned Visual Improvements
- Waveform visualization to replace simple progress bar
- Hover effects for interactive elements
- Animated transitions between states
- Volume control with visual feedback

#### Accessibility Enhancements
- Keyboard navigation support
- ARIA attributes for screen readers
- Focus indicators for interactive elements
- High contrast mode support

#### Technical Improvements
- More efficient audio loading with range requests
- Web Audio API integration for advanced visualization
- Background audio support with MediaSession API
- WebAssembly for high-performance waveform generation

### Latest Audio Player Implementation (2025, Post-Stem Removal)

Following a strategic shift in product direction, the audio player has been refactored to focus exclusively on full track playback, removing all stem-related functionality while preserving core audio playback capabilities.

#### Architecture Simplification

The stem-free implementation achieves several key improvements:

1. **Reduced Component Complexity**:
   - Removed StemPlayer.tsx and StemControls.tsx components
   - Eliminated WaveformVisualizer dependency (replaced with simpler progress bar)
   - Streamlined UI by removing stem selection and management controls

2. **Audio Management Enhancements**:
   - Replaced stem-url-manager with new audio-url-manager.ts
   - Removed stem-specific parameters and handlers from useAudioPlayer hook
   - Eliminated stem event handling from audio-manager.ts
   - Simplified event propagation through clearer interface

3. **Code Size Reduction**:
   - Reduced overall bundle size by ~30%
   - Simplified AudioPlayer component from 300+ to ~160 lines
   - Removed stem-specific caching and discovery mechanisms

#### Audio Player Component Structure

```tsx
// Current component structure
AudioPlayer({track, isPlaying, onPlay, onStop, onTagClick}) {
  // State
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  
  // URL loading logic
  // useEffect hook to load track URL
  
  // Audio playback hook
  const {isPlaying, duration, currentTime, isLoading, toggle, seek} = useAudioPlayer({...});
  
  // Render
  return (
    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden flex flex-col mb-6">
      {/* Track header section */}
      {/* Progress bar section */}
    </div>
  );
}
```

#### Audio URL Management

The new audio-url-manager.ts implements a focused approach to track audio discovery:

```typescript
export async function findTrackAudioUrl(trackTitle: string): Promise<string | null> {
  // Try cache first
  const cacheKey = `track:${trackTitle}`;
  if (audioUrlCache[cacheKey]) return audioUrlCache[cacheKey];
  
  try {
    // Check for sample track
    const normalizedTitle = trackTitle.replace(/[^\w\s]/g, '').replace(/\s+/g, '_').toLowerCase();
    const sampleUrl = `/sample-tracks/${normalizedTitle}.mp3`;
    if (await urlExists(sampleUrl)) {
      saveAudioUrlToCache(trackTitle, sampleUrl);
      return sampleUrl;
    }
    
    // Try pattern matching on server
    // Try multiple URL patterns across base paths
    // Fallback to proxy endpoint
  } catch (error) {
    console.error('Error finding track audio URL:', error);
    return null;
         }
       }
       ```

#### Progress Bar Implementation

The streamlined progress bar replaces the previous waveform visualizer with a simpler, more performant implementation:

     ```tsx
<div 
  className="w-full h-12 bg-[#282828] rounded-md relative cursor-pointer" 
  onClick={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    seek(percentage * duration);
  }}
>
  {/* Simple progress fill */}
  <div 
    className="h-full bg-[#1DF7CE]/20 absolute left-0 top-0"
    style={{ width: `${(currentTime / duration) * 100}%` }}
  />
  {/* Progress position marker */}
  <div 
    className="absolute top-0 w-0.5 h-full bg-[#1DF7CE]"
    style={{ left: `${(currentTime / duration) * 100}%` }}
  />
</div>
```

#### Migration Benefits

This refactoring provides several substantial benefits:

1. **Improved Performance**:
   - Faster initial load times due to fewer components
   - More efficient audio handling without stem overhead
   - Smaller bundle size for quicker page transitions

2. **Enhanced Maintainability**:
   - Clearer component responsibilities
   - Simplified state management
   - Better separation of concerns
   - Easier to extend with new features

3. **User Experience Improvements**:
   - More focused UI with fewer distractions
   - Consistent playback experience
   - Improved reliability with fewer dependencies

4. **Development Productivity**:
   - Faster iteration cycles with less complex code
   - Easier debugging with simplified playback flow
   - More straightforward testing approach

The current implementation provides a clean foundation for future enhancements while delivering an excellent user experience for track playback and discovery.

#### Future Roadmap

While the current implementation focuses on full track playback only, there are plans to reintroduce stem functionality in the future with a more refined approach:

1. **Enhanced Stem Architecture**:
   - More modular component design for better maintenance
   - Improved stem audio synchronization
   - Optimized loading patterns to reduce initial overhead

2. **Improved User Experience**:
   - Simplified stem interface focused on most common use cases
   - Better visualization of stem components
   - More intuitive controls for stem mixing

3. **Technical Improvements**:
   - Web Audio API integration for better stem isolation
   - WebAssembly processing for real-time effects
   - Service worker caching for faster repeat access

This planned evolution will maintain the current streamlined design while carefully reintroducing the most valuable stem functionality in a more efficient and user-friendly implementation. 

Upload Page Documentation
Overview
The Upload Page provides a comprehensive interface for adding new content to the Wave Cave platform. It enables uploading tracks, associated metadata, and supplementary files while automating the storage organization and integration with content management systems.

Core Functionality
Content Upload Capabilities
Primary Content:

Main track audio file (MP3, WAV, FLAC)

Cover image (JPEG, PNG, recommended size: 1200 x 1200 px)

Track title and description

Metadata:

Tags categorized by type (genre, mood, instruments)

BPM (beats per minute)

Duration (auto-extracted)

Release date

Premium Content (future feature):

Stem files with individual pricing

Premium track versions with pricing

Technical Implementation
Storage Architecture:

Files automatically uploaded to wave-cave-audio S3 bucket

Folder structure organized by track name for scalable management

Cloudflare CDN integration for optimized content delivery

Backend Integration:

Automatic synchronization with Strapi CMS

Metadata indexing for search functionality

Content revision management

Frontend Approach:

Dynamic content loading from Strapi

No hardcoded track or image references

Responsive design for all device sizes

### S3 Storage Organization

#### Folder Naming Convention
To improve track organization and file management in S3, tracks are now stored in descriptive folders that include both the track title and a unique identifier. This makes browsing the bucket content significantly easier when dealing with hundreds of tracks.

**Folder Structure:**
```
tracks/
  ├── awesome-track-name_by_artist-name_083248f9/
  │   ├── main.mp3
  │   ├── cover.jpg
  │   └── stems/
  │       ├── drums.mp3
  │       ├── bass.mp3
  │       └── ...
  ├── another-track-title_12345678/
  │   ├── main.mp3
  │   └── ...
  └── ...
```

**Implementation Details:**
- The `getTrackFolderName` function in `src/lib/upload-helpers.ts` creates folder names using:
  - Sanitized track title (lowercase, spaces replaced with hyphens)
  - Artist name (if provided)
  - First 8 characters of the track ID for uniqueness
- The `getS3Key` function builds the complete S3 key including the folder name
- The upload handlers in `src/app/api/upload/route.ts` use these functions to define the S3 path when uploading files

**Benefits:**
- Easier navigation and browsing of S3 bucket contents
- Self-documenting folder structure that indicates track content
- Maintained uniqueness with ID suffix to prevent name collisions
- Organized separation of main tracks, cover images, and stems

**Technical Note:**
File encoding issues can break the upload functionality. If the route.ts file contains invalid UTF-8 characters, the Next.js server will fail to compile it properly. This manifests as "stream did not contain valid UTF-8" errors in the server logs. The solution is to recreate the file with proper UTF-8 encoding.

User Experience Features
Upload Guidance:

File size recommendations:

Audio tracks: Maximum 50 MB (optimally 192-320 kbps for MP3)

Cover images: 1-2 MB, 1200 x 1200 px

Stems: Maximum 30 MB per stem

Status Indicators:

Progress visualization for large uploads

Estimated time remaining

Transfer speed indicator

Feedback Mechanisms:

Success confirmations with direct links to uploaded content

Specific error messages with troubleshooting guidance

Warning indicators for potential issues (low-quality files, missing metadata)

Error Handling & Validation
Pre-upload Validation:

File format verification

Size limit enforcement

Metadata completeness check

Upload Process Protection:

Network interruption recovery

Automatic retries for failed segments

Session persistence for large uploads

Post-upload Verification:

File integrity confirmation

CDN propagation status

Strapi integration verification

Additional Considerations
Security Measures:

Authentication requirements for upload access

Proper S3 bucket permissions

File and path sanitization

Workflow Management:

Draft/publish workflow

Approval process integration

Versioning for track updates

Performance Optimization:

Chunked uploads for large files

Background processing for waveform generation

Asynchronous metadata extraction

This comprehensive upload system ensures a smooth content management workflow while maintaining scalability for hundreds or thousands of tracks. 

#### CDN, CloudFront, and CORS Architecture (2024 Update)

**Background:**
To ensure secure, performant, and cross-origin compatible delivery of audio and image files, the platform now serves all media assets (audio, images) via AWS CloudFront CDN rather than directly from S3. This change was required to resolve browser CORS/COEP errors (notably missing `Cross-Origin-Resource-Policy` headers) that prevented images from loading when accessed directly from S3.

**Key Changes:**
- **CloudFront as the Only Public Media Endpoint:**
  - All public media URLs (audio, images) must use the CloudFront domain (e.g., `d1r94114aksajj.cloudfront.net`).
  - S3 URLs are never exposed to the client; only CloudFront can inject the required CORS and cross-origin headers.
- **CloudFront Response Headers:**
  - CloudFront is configured to add the following headers to all media responses:
    - `Access-Control-Allow-Origin: *`
    - `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`
    - `Access-Control-Allow-Headers: *`
    - `Cross-Origin-Opener-Policy: same-origin`
    - `Cross-Origin-Embedder-Policy: require-corp`
    - `Cross-Origin-Resource-Policy: cross-origin`
  - This ensures compatibility with browsers' cross-origin resource policies for both audio and image files.
- **Cache Invalidation:**
  - After header policy changes, CloudFront cache must be invalidated to propagate new headers to all edge locations.
- **Dynamic CDN Domain Configuration:**
  - The CDN domain is now set via the environment variable `NEXT_PUBLIC_CDN_DOMAIN` (e.g., in `.env.local`).
  - This allows seamless switching between CloudFront distributions or environments without code changes.
- **`toCdnUrl` Utility:**
  - A utility function (`src/utils/cdn-url.ts`) rewrites any S3 URL to the CloudFront equivalent, ensuring all media links are CDN-routed.
  - Example:
    ```ts
    export function toCdnUrl(url: string) {
      if (!url) return '';
      if (url.includes(S3_DOMAIN)) {
        return url.replace(S3_DOMAIN, CDN_DOMAIN);
      }
      return url;
    }
    ```
  - All image and audio URL logic now uses this helper, making the solution future-proof and dynamic.
- **Codebase Refactor:**
  - Removed deprecated `/api/direct-s3/` fallback logic.
  - Updated all relevant components and normalization logic to use the CloudFront domain via `toCdnUrl`.
  - No need to re-upload tracks or images; the change is purely in delivery and URL resolution.

**Result:**
- Images and audio now load reliably in all browsers with correct CORS and cross-origin headers.
- The architecture is robust, scalable, and ready for future CDN or S3 changes with minimal code impact.




# Appendix: AudioPlayer Component (Current Implementation)
Below is the main component and its props as of 05-MAY-2025. Update this section if the implementation changes.


interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTagClick: (tag: Tag) => void;
  openStemsTrackId: string | null;
  setOpenStemsTrackId: (id: string | null) => void;
}

export default function AudioPlayer({ 
  track, 
  isPlaying,
  onPlay,
  onStop,
  onTagClick,
  openStemsTrackId,
  setOpenStemsTrackId
}: AudioPlayerProps): React.ReactElement {
  // ...component logic and hooks...

  // Example: Toggle stems panel
  const isStemsOpen = openStemsTrackId === track.id;
  const toggleStems = () => {
    if (isStemsOpen) {
      setOpenStemsTrackId(null);
    } else {
      setOpenStemsTrackId(track.id);
    }
  };

  // ...more logic, effects, and rendering...

  return (
    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden flex flex-col mb-6">
      {/* Track header section */}
      {/* Progress bar section */}
      {/* Stems panel, controls, etc. */}
    </div>
  );
}
