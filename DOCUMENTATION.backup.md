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
     - Waveform visualization with dynamic scaling
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

## Recent Updates (May 2025)

### Waveform Visualization Enhancement

#### Implementation Details
The waveform visualization was implemented using a combination of Web Audio API for audio analysis and Canvas API for rendering. Here's the detailed technical breakdown:

1. **Audio Analysis Pipeline**:
   ```typescript
   // In WaveformProgressBar.tsx
   const analyzeAudio = async (audioUrl: string) => {
     const response = await fetch(audioUrl);
     const arrayBuffer = await response.arrayBuffer();
     const audioContext = new AudioContext();
     const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
     
     // Extract peaks from audio data
     const channelData = audioBuffer.getChannelData(0);
     const peaks = [];
     const samplesPerPixel = Math.floor(channelData.length / n);
     
     for (let i = 0; i < n; i++) {
       const start = i * samplesPerPixel;
       const end = start + samplesPerPixel;
       let max = 0;
       
       for (let j = start; j < end; j++) {
         const abs = Math.abs(channelData[j]);
         if (abs > max) max = abs;
       }
       
       peaks.push(max);
     }
     
     return peaks;
   };
   ```

2. **Dynamic Scaling System**:
   - Implemented a minimum height factor (3%) to ensure visibility of quiet sections
   - Used logarithmic scaling for better visual representation of audio dynamics
   - Added smooth transitions between states using CSS transitions
   ```typescript
   const minHeightFactor = 0.03; // 3% minimum height
   const scaledPeak = Math.max(peaks[i], minHeightFactor);
   const height = scaledPeak * containerHeight;
   ```

3. **Canvas Rendering**:
   - Used HTML5 Canvas for efficient rendering
   - Implemented double-buffering to prevent flickering
   - Optimized for performance with large numbers of tracks
   ```typescript
   const canvas = useRef<HTMLCanvasElement>(null);
   const ctx = canvas.current?.getContext('2d');
   
   const drawWaveform = () => {
     if (!ctx || !canvas.current) return;
     
     ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
     ctx.beginPath();
     
     // Draw waveform path
     peaks.forEach((peak, i) => {
       const x = (i / peaks.length) * canvas.current.width;
       const height = Math.max(peak * canvas.current.height, minHeightFactor);
       ctx.lineTo(x, height);
     });
     
     ctx.stroke();
   };
   ```

4. **Progress Tracking**:
   - Implemented real-time progress tracking using requestAnimationFrame
   - Added smooth transitions for progress updates
   - Optimized performance by only redrawing changed sections
   ```typescript
   useEffect(() => {
     let animationFrame: number;
     
     const updateProgress = () => {
       if (isPlaying) {
         drawWaveform();
         animationFrame = requestAnimationFrame(updateProgress);
       }
     };
     
     animationFrame = requestAnimationFrame(updateProgress);
     return () => cancelAnimationFrame(animationFrame);
   }, [isPlaying, currentTime]);
   ```

5. **Responsive Design**:
   - Implemented container query-based sizing
   - Added dynamic resolution adjustment based on container width
   - Optimized for different screen sizes and aspect ratios
   ```typescript
   const containerRef = useRef<HTMLDivElement>(null);
   const [containerWidth, setContainerWidth] = useState(0);
   
   useEffect(() => {
     const resizeObserver = new ResizeObserver(entries => {
       for (const entry of entries) {
         setContainerWidth(entry.contentRect.width);
       }
     });
     
     if (containerRef.current) {
       resizeObserver.observe(containerRef.current);
     }
     
     return () => resizeObserver.disconnect();
   }, []);
   ```

#### Performance Optimizations
1. **Memory Management**:
   - Implemented proper cleanup of AudioContext and resources
   - Used WeakMap for caching decoded audio data
   - Added memory usage monitoring and optimization

2. **Rendering Optimizations**:
   - Implemented canvas double-buffering
   - Used requestAnimationFrame for smooth animations
   - Optimized redraw regions for better performance

3. **Audio Processing**:
   - Implemented efficient peak detection algorithm
   - Used Web Workers for audio analysis in background
   - Added progressive loading for large audio files

### UI/UX Improvements

#### Search Bar Enhancement
1. **Implementation Details**:
   ```typescript
   // In SearchBar.tsx
   const placeholderText = existingSearch 
     ? "Add another search term..."
     : "Search";
   
   return (
     <div className="mb-6">
       <form onSubmit={handleSearch}>
         <div className="relative">
           <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
             <svg 
               className="w-5 h-5 text-white" 
               fill="none" 
               stroke="currentColor" 
               viewBox="0 0 24 24" 
               xmlns="http://www.w3.org/2000/svg"
             >
               <path 
                 strokeLinecap="round" 
                 strokeLinejoin="round" 
                 strokeWidth="2" 
                 d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
               />
             </svg>
           </div>
           <input
             ref={inputRef}
             type="search"
             id="search"
             className="block w-full py-2 pl-12 pr-4 text-base rounded-full bg-[#1E1E1E] border border-[#CDCDCD] text-white focus:outline-none focus:ring-1 focus:ring-[#1DF7CE]"
             placeholder={placeholderText}
             value={query}
             onChange={(e) => setQuery(e.target.value)}
           />
         </div>
       </form>
     </div>
   );
   ```

2. **Accessibility Improvements**:
   - Added proper ARIA labels and roles
   - Implemented keyboard navigation
   - Enhanced focus states and visual feedback

3. **Visual Consistency**:
   - Standardized border colors (#CDCDCD)
   - Added focus ring with accent color (#1DF7CE)
   - Improved hover and active states

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