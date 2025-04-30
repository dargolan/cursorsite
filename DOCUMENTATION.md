# WaveCave Audio Marketplace

A marketplace platform for musicians to buy and sell individual stems from audio tracks.

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

3. **E-commerce Integration**
   - Free track downloads
   - Stem purchases
   - Shopping cart functionality
   - User authentication for purchases

4. **Content Management**
   - Automated track and stem upload system
   - Metadata extraction
   - Tag management
   - Analytics tracking

## Project Status

### Completed Items

#### Frontend
- ✅ Set up Next.js frontend with TypeScript
- ✅ Implemented responsive layout with TailwindCSS
- ✅ Created consistent design system with brand colors (#1DF7CE as primary accent)
- ✅ Built homepage with featured tracks, genres, and projects sections
- ✅ Added explore page with filtering capabilities
- ✅ Implemented sidebar navigation with filters for genre, mood, instruments
- ✅ Added cart functionality with React Context API
- ✅ Integrated header with navigation links (Home, Music, Sound Effects, Video, About, Contact)
- ✅ Styled buttons and forms with rounded corners for consistent UI
- ✅ Implemented search functionality in sidebar and main areas
- ✅ Added hero section with custom imagery
- ✅ Implemented stem player with individual track control
- ✅ Added waveform visualization for stems
- ✅ Integrated volume controls and solo/mute functionality
- ✅ Optimized audio loading and playback performance
- ✅ Created dedicated services for Strapi API communication
- ✅ Implemented comprehensive error handling for audio operations

#### Backend
- ✅ Set up Strapi headless CMS
- ✅ Created content types for tracks, stems, genres, and users
- ✅ Implemented services for track and stem management
- ✅ Added S3 integration for media storage
- ✅ Set up authentication and user management
- ✅ Created content type schemas
- ✅ Created controllers and services
- ✅ Configured AWS S3 integration for media storage
- ✅ Set up CloudFront CDN for efficient media delivery
- ✅ Created API endpoints for track and tag management
- ✅ Implemented search functionality with tag-based filtering
- ✅ Added proper TypeScript types for all new features

### In Progress

#### Frontend
- 🔄 Finalizing responsive design for mobile devices
- 🔄 Enhancing audio player functionality
- 🔄 Implementing checkout process
- 🔄 Building user profile pages
- 🔄 Implementing advanced search with audio characteristics
- 🔄 Adding waveform visualization enhancements
- 🔄 Optimizing stem player performance for mobile devices

#### Backend
- ✅ Finalizing S3 configuration for production
- 🔄 Setting up Stripe payment integration
- 🔄 Implementing analytics for track plays and downloads
- 🔄 Optimizing database queries for performance
- 🔄 Implementing caching strategy for popular content

### Next Steps

#### Frontend
- ⬜ Add artist/producer profile pages
- ⬜ Implement social sharing features
- ⬜ Add user favorites/collections feature
- ⬜ Build advanced search with audio characteristics
- ⬜ Add collaborative features for producers
- ⬜ Implement stem preview limitations
- ⬜ Add batch download functionality for purchased stems

#### Backend
- ⬜ Optimize database queries for performance
- ⬜ Implement caching strategy for popular content
- ⬜ Set up CI/CD pipeline for automated deployment
- ⬜ Add email notification system for purchases and updates
- ✅ Set up S3/CDN integration (AWS setup pending)
- ✅ Create upload interface
- ⬜ Implement metadata extraction
- ⬜ Set up e-commerce integration
- ⬜ Set up automated backup system for S3 buckets
- ⬜ Implement rate limiting for API endpoints
- ⬜ Add webhook support for external integrations

#### General
- ✅ Started the Next.js development server and Strapi backend
- ⬜ Comprehensive testing (unit, integration, e2e)
- ⬜ SEO optimization
- ⬜ Analytics integration
- ⬜ Documentation for API endpoints and component library

## Recent Updates

### Progress Since Latest Environment Update (May 2025)

- **Environment variables**: Updated `.env.local` to set Strapi API and Media URLs, which are now used by the app and proxy for all media and API requests.
- **AWS S3 Configuration**: Set up multiple S3 buckets for the project:
  - `dargo-music-library`: Initial music library storage
  - `dargo-strapi-media`: Strapi CMS media storage
  - `wave-cave-audio`: Production audio files (selected as primary bucket)
  - `wave-cave-audio-dev`: Development environment audio files
- **S3 Integration Steps**:
  - Created and configured S3 buckets with appropriate permissions
  - Selected `wave-cave-audio` as the production bucket
  - Added bucket name to `.env.local` for use by the application
  - Updated environment variables to point to the correct S3 endpoints
- **Tag system refactor**: Migrated the tag system to use Tag objects throughout the codebase. The `TagSelector` component and all tag-related state now use `Tag` objects (`id`, `name`, `type`) instead of strings. This improves filtering, display, and backend integration for tags. The upload page and any future tag-related features now expect and handle Tag objects.
- **Documentation**: Updated both `README.md` and `DOCUMENTATION.md` to reflect the tag system migration and environment changes.
- **Migration plan**: Added a comprehensive website overview and executed a step-by-step migration plan for the tag system.
- **Development servers**: Started the Next.js development server and Strapi backend. The app is running and proxying requests to Strapi. Proxy errors for missing media files were observed, but the main application and tag system refactor are functioning as intended.

### Tag System Refactor (May 2025)

The tag selection system has been refactored to use Tag objects throughout the codebase:

- The `TagSelector` component and all tag-related state now use `Tag` objects (with `id`, `name`, and `type`) instead of plain strings.
- This change improves filtering, display, and backend integration for tags.
- The upload page and any future tag-related features now expect and handle Tag objects.
- Predefined tags are now objects, and custom tags are supported with full metadata.

### Cart System Update (April 20, 2025)

The cart system has been completely redesigned to use React Context API:

1. **New CartContext**:
   - Added a centralized `CartContext` to manage cart state globally
   - All cart operations now use the `useCart()` hook for consistency
   - Implemented proper localStorage synchronization across tabs

2. **Migration from Legacy Implementation**:
   - Removed direct localStorage access in components
   - Deprecated the old `/services/cart.ts` functions
   - Added backward compatibility layer for existing code

3. **Type Improvements**:
   - Aligned CartItem interfaces across the codebase
   - Added proper type checking for cart operations

To use the cart system, import the `useCart()` hook:

```tsx
import { useCart } from '@/contexts/CartContext';

function MyComponent() {
  const { items, addItem, removeItem, getItemCount, getTotalPrice } = useCart();
  
  // Use these functions to interact with the cart
}
```

### Performance Improvements (April 10, 2025)

The codebase has undergone significant performance improvements with a focus on the audio playback system:

1. **Modular Architecture**:
   - Split monolithic `AudioPlayer.tsx` (83KB) into smaller functional components
   - Created reusable hooks for audio playback logic
   - Extracted utility functions into dedicated files

2. **Audio Management**:
   - Enhanced `audio-manager.ts` to support better event handling
   - Added support for stem-specific playback control
   - Implemented efficient time updates (250ms intervals) to reduce CPU usage

3. **React Optimizations**:
   - Implemented component memoization to prevent unnecessary re-renders
   - Used `useCallback` for event handlers to maintain referential stability
   - Created custom hooks that encapsulate complex logic

4. **Resource Management**:
   - Added proper cleanup for audio resources
   - Implemented better error handling for audio loading failures
   - Created robust lifecycle management for audio elements

### UI/UX Improvements
- Repositioned sidebar collapse toggle button next to the Filters heading
- Fixed unwanted space on right side of homepage and corrected sidebar default state
- Improved sidebar behavior: initially collapsed on homepage, persists user preference across pages
- Standardized search bar design between hero section and sidebar
- Fixed slider persistence to maintain positions when navigating between pages
- Made sidebar functionality consistent across website by redirecting filters to Music page
- Updated top menu to adjust position based on sidebar state
- Fixed RangeSlider component to correct edge dragging issues
- Enhanced top menu with proper color states (gray idle, accent color on hover/active)
- Adjusted hero section: doubled title font size and improved text alignment
- Added more spacing between hero elements for better visual hierarchy
- Updated sidebar to initialize with proper slider ranges
- Added Home button to top navigation
- Added sidebar to homepage matching explore page
- Updated UI elements with rounded corners for consistency
- Fixed image display issues in hero section
- Updated Next.js configuration for better image handling
- Aligned color scheme across all pages (#1DF7CE as primary accent)

### Stem Player Implementation (May 2025)

The stem player has been completely redesigned with advanced functionality:

1. **Audio Processing**:
   - Individual control for each stem component
   - Real-time volume adjustment
   - Solo/mute functionality per stem
   - Synchronized playback across all stems
   - Efficient audio buffer management

2. **Visualization**:
   - Waveform display for each stem
   - Color-coded stem identification
   - Interactive timeline scrubbing
   - Visual feedback for solo/mute states
   - Loading and progress indicators

3. **Performance Optimizations**:
   - Lazy loading of audio resources
   - Efficient memory management
   - Background processing for waveform generation
   - Optimized rendering with React.memo
   - Debounced volume controls

4. **User Experience**:
   - Intuitive stem controls
   - Visual feedback for all actions
   - Responsive design for all screen sizes
   - Keyboard shortcuts for common actions
   - Touch-friendly controls for mobile

5. **Error Handling**:
   - Graceful fallbacks for unsupported formats
   - Clear error messages for users
   - Automatic recovery attempts
   - Logging for debugging
   - Alternative playback options

## Migration Plan

### Technical Requirements
1. **Performance**
   - Lazy loading for audio players
   - Optimized waveform rendering
   - Efficient tag filtering
   - Responsive design

2. **Scalability**
   - Support for thousands of tracks and stems
   - Efficient database structure
   - CDN integration for media delivery

3. **User Experience**
   - Single audio playback at a time
   - Single stem dropdown at a time
   - Intuitive filtering system
   - Seamless download process

### Current State
- We have a Next.js frontend with an audio player that handles tracks and stems
- Currently using Strapi as the CMS
- Need to migrate to a more scalable solution with S3/CDN integration

### Migration Goals
1. Separate track and stem management
2. Implement direct S3/CDN uploads
3. Automate metadata extraction
4. Make Strapi the central source of truth for:
   - Track/stem relationships
   - User data and permissions
   - E-commerce data (purchases, carts)
   - Tag management
   - Analytics and usage tracking

### Content Types Created

#### Track
- Core metadata (title, description, BPM, duration)
- File information (URLs, size, format)
- Analytics (play count, download count)
- SEO fields
- Relationships to stems and tags
- Waveform data storage

#### Stem
- Core metadata (name, type, description)
- E-commerce fields (price, SKU, availability)
- File information (URLs, size, format)
- Analytics (purchase count, preview count)
- Relationship to parent track

#### Tag
- Categorization (name, type)
- Description
- SEO fields
- Many-to-many relationship with tracks

#### Upload Batch
- Status tracking
- Progress monitoring
- Error logging
- Relationship to processed tracks

### Implementation Details

#### Controllers Created
1. Track Controller
   - CRUD operations
   - Analytics tracking (play count, download count)
   - Bulk creation support

2. Stem Controller
   - CRUD operations
   - Analytics tracking (preview count, purchase count)
   - Bulk creation support

#### Services Created
1. Track Service
   - Metadata extraction (placeholder)
   - Waveform generation (placeholder)
   - Data validation
   - Analytics updates
   - Related tracks functionality

2. Stem Service
   - Data validation
   - SKU generation
   - Analytics updates
   - Track stem management

#### S3/CDN Integration
1. AWS S3 Configuration
   - Bucket configuration: Selected `wave-cave-audio` as the production bucket
   - Created additional buckets for development (`wave-cave-audio-dev`) and other purposes
   - Access credentials configured in environment variables
   - Region settings optimized for content delivery

2. Upload Service
   - File validation
   - S3 upload handling
   - CDN URL generation
   - File deletion
   - Type-specific upload methods

3. Environment Configuration
   - AWS credentials
   - CDN domain
   - Security settings

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

## Features

- Browse and search for audio tracks
- Preview individual stem components
- Purchase and download stems
- User account management
- Producer profiles

## License

This project is licensed under the MIT License.

### AWS & CDN Environment Variables

The following environment variables are required for media upload and delivery, and should be set in your `.env.local` file:

```
AWS_ACCESS_KEY_ID=A****B
AWS_SECRET_ACCESS_KEY=G****Mg
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=wave-cave-audio
CDN_DOMAIN=d1r94114aksajj.cloudfront.net
```

These configure the app to use the production S3 bucket (`wave-cave-audio`) and the associated CloudFront CDN for fast, global media delivery.

## Storage & Naming Conventions

### S3 Bucket Structure
The platform now uses track title-based paths instead of UUIDs for better organization and maintainability. Current structure in the S3 bucket:

```
wave-cave-audio/
└── tracks/
    ├── track-name-1/
    │   ├── main.mp3         # Main track audio
    │   ├── cover.jpg        # Track cover image
    │   └── stems/           # Optional folder for individual stems
    │       ├── drums.mp3
    │       ├── bass.mp3
    │       └── guitars.mp3
    └── b3a7ae0b-4a9f-4b94-9a60-c168d97841da/  # Legacy UUID format still supported
        ├── main.mp3
        ├── cover.jpg
        └── stems/
```

### Known Issues & Solutions (May 2025)

1. **File Naming Consistency**:
   - **Issue**: Main tracks are saved as "main.mp3" rather than using the track title
   - **Solution**: This is by design for consistent file referencing. The track name is used for the folder, while standard filenames (main.mp3, cover.jpg) are used for the actual files to maintain consistency.

2. **Duplicate Tracks**:
   - **Issue**: Multiple instances of the same track appearing in the Music page
   - **Solution**: This could be due to duplicate entries in the Strapi database. Check the Strapi admin panel and remove duplicate entries, or add a uniqueness constraint on track titles.

3. **Missing Cover Images**:
   - **Issue**: Cover images not displaying despite existing in the S3 bucket
   - **Solution**: Ensure the cover image is named exactly "cover.jpg" (lowercase) within the track folder. The code expects this exact filename and path.

4. **Missing Stems Button**:
   - **Issue**: Stems button not appearing even when stems are available
   - **Solution**: Verify that the track entry in Strapi has its stems properly linked in the relationship field. The hasStems property must be true and stems array should not be empty.

5. **API Connection Issues & CORS Errors**:
   - **Issue**: Frontend fails to connect to Strapi API with CORS errors or "Invalid key" validation errors
   - **Solutions**:
     - **CORS Configuration**: Update Strapi's CORS middleware with simplified settings:
       ```js
       // strapi-backend/config/middlewares.ts
       {
         name: 'strapi::cors',
         config: {
           origin: '*',  // For development; use specific origins in production
           methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
           headers: ['Content-Type', 'Authorization', 'Origin', 'Accept']
         }
       }
       ```
     - **API URL Consistency**: Use `localhost` instead of `127.0.0.1` consistently throughout the application
     - **Request Configuration**: Ensure fetch requests use correct options:
       ```js
       // Proper request options
       {
         headers: { ... },
         mode: 'cors',
         cache: 'no-store',
         credentials: 'omit'  // Important when using token authentication
       }
       ```
     - **Query Parameter Format**: Use `populate=*` for Strapi v4 to populate relations instead of complex nested parameters
     - **Strapi Permissions**: Ensure both `find` and `findOne` permissions are enabled for public access to the Track and Tag content types
     - **Server Configuration**: Set `url` property in `server.ts` to ensure Strapi knows its public URL:
       ```js
       // strapi-backend/config/server.ts
       url: env('PUBLIC_URL', 'http://localhost:1337')
       ```

### Important Note on ID Mapping and Scalability

#### ⚠️ AVOID HARDCODING IDs

The current implementation contains temporary hardcoded mappings between Strapi's numeric IDs and S3's UUIDs. This approach is **NOT SCALABLE** and is only intended as a temporary solution during development.

For proper production deployment:

1. **Dynamic ID Resolution**: Implement a robust system that dynamically fetches track data from Strapi including all necessary metadata and file paths.

2. **Metadata Storage**: Each track in S3 should include metadata that links back to its Strapi ID, allowing for reliable lookups without hardcoding.

3. **Central Mapping Service**: Create a dedicated service that maintains the relationship between Strapi entities and their corresponding S3 resources. This service should:
   - Cache frequently accessed mappings for performance
   - Update when new content is added
   - Provide fallback mechanisms when mappings aren't found
   - Use a database table instead of in-memory or file-based caching for persistence

4. **Webhook Integration**: Set up Strapi webhooks to automatically update the mapping service when content changes, ensuring S3 paths and Strapi IDs remain synchronized.

Hardcoded mappings will be removed before production release, replaced with the dynamic fetching solution described above.

### File Naming Requirements

While the system now supports more flexible file naming through dynamic endpoint resolution, following these conventions is still recommended for consistency:

1. **Track Folders**: Use the track title in kebab-case: `rock-intro/` instead of `Rock Intro/`
2. **Main Audio Files**: Preferably use `main.mp3`, though the system will also recognize:
   - `main.wav`
   - `track.mp3`
   - `audio.mp3`
3. **Cover Images**: Preferably use `cover.jpg`, though the system will also recognize:
   - `cover.png`
   - `image.jpg`
   - `cover.webp`
   - `artwork.jpg`
4. **Stems**: Can use descriptive names like `drums.mp3`, `bass.mp3`, etc.

The new dynamic endpoint approach allows files to be found even if they don't follow these exact naming conventions, but following these guidelines helps maintain consistency across the platform.

### API Endpoints for Media Access

The platform provides several methods to access media files:

1. **Dynamic Type-Based Endpoints** (Recommended):
   - `/api/direct-s3/tracks/{id}/image` - Retrieves any cover image for the track, trying multiple formats
   - `/api/direct-s3/tracks/{id}/audio` - Retrieves any audio file for the track, trying multiple formats
   - Example: `/api/direct-s3/tracks/rock-intro/image`

2. **Legacy Direct File Access** (Still supported):
   - `/api/direct-s3/tracks/{track-name}/{specific-file}`
   - Example: `/api/direct-s3/tracks/rock-intro/main.mp3`
   - Automatically resolves track names to actual folder paths
   - Will be deprecated in favor of the dynamic endpoints

3. **S3 Track Listing**: `/api/s3-list-tracks`
   - Returns all available tracks in the S3 bucket
   - Useful for debugging and discovery

4. **Legacy CloudFront Access**: 
   - Automatically proxied through the direct-s3 API
   - Example: `https://d1r94114aksajj.cloudfront.net/tracks/{uuid}/main.mp3`
   - Will be deprecated in favor of the dynamic endpoints

For new development, always use the dynamic type-based endpoints (`/image` and `/audio`) as they provide the most flexibility and will be maintained going forward.

### Debugging Tools

For troubleshooting file access issues, use the Track Finder debug tool at `/debug/track-finder.html`, which allows you to:
1. Enter a track name and see if it can find matching files in S3
2. List all available tracks in your bucket
3. Test playback from the name-based URLs

## ID to UUID Mapping System

### Updates and Improvements

#### Removal of Hardcoded ID-to-UUID Mappings

The codebase previously contained hardcoded emergency mappings that directly linked numeric Strapi IDs to S3 UUIDs. These hardcoded mappings have been removed from the following locations:

1. `src/app/api/direct-s3/[...path]/route.ts` - Emergency mappings in the API route
2. `src/utils/client-mapping.ts` - Client-side emergency mappings
3. `src/app/explore/page.tsx` - Fallback hardcoded UUID in the UI

The system now relies entirely on dynamic resolution through:
1. Direct Strapi API queries - Primary source of UUID information
2. ID mapping cache - Secondary source, populated from Strapi
3. UUID discovery from S3 - Used as a fallback when metadata files contain ID references

This change makes the system more flexible and maintainable as all mappings are now stored in a centralized location (Strapi) rather than being hardcoded across multiple files.

For tracks that don't have proper metadata or UUIDs in Strapi, a placeholder image is now displayed rather than falling back to a hardcoded track's assets.

#### Eliminating Hardcoded File Names With Dynamic Endpoints

In addition to removing hardcoded ID-to-UUID mappings, we've also eliminated hardcoded file name dependencies by implementing dynamic endpoint resolution. This further improves the system's flexibility and maintainability:

1. **Previous Issue**: 
   - The system previously relied on specific filenames (`cover.jpg`, `main.mp3`) throughout the codebase
   - This created brittle dependencies, requiring exact filename matches in S3
   - 404 errors would occur if files used different naming conventions or formats (e.g., PNG instead of JPG)

2. **Solution - Dynamic Type-Based Endpoints**:
   - Replaced hardcoded file path references with generic type-based endpoints:
     - `/api/direct-s3/tracks/{id}/image` (replacing `/api/direct-s3/tracks/{id}/cover.jpg`)
     - `/api/direct-s3/tracks/{id}/audio` (replacing `/api/direct-s3/tracks/{id}/main.mp3`)
   - Updated the following files:
     - `src/services/strapi.ts`: Changed normalizeTrack to use `/image` endpoint
     - `src/app/api/direct-s3/[...path]/route.ts`: Enhanced to try multiple file formats when resolving paths
     - `src/app/api/debug/route.ts`: Updated test URLs to use dynamic endpoints
     - `src/app/debug/page.tsx`: Updated link generation to use dynamic endpoints

3. **How It Works**:
   - When a request comes in for `/api/direct-s3/tracks/{id}/image`, the API tries multiple file formats:
     - Checks for `cover.jpg`, `cover.png`, `image.jpg`, `cover.webp`, `artwork.jpg`
   - Similarly, `/api/direct-s3/tracks/{id}/audio` tries various audio formats:
     - Checks for `main.mp3`, `main.wav`, `track.mp3`, `audio.mp3`
   - Returns the first matching file, regardless of its exact name
   - Creates a consistent API interface independent of the underlying file structure

4. **Benefits**:
   - More resilient to different file formats and naming conventions
   - Enables future support for additional formats without code changes
   - Provides a clean, consistent API for client components
   - Simplifies onboarding by removing strict naming requirements
   - Improves error handling with a dedicated placeholder image endpoint

5. **Frontend Implementation**:
   - **Enhanced Track Data Service**: The `getTracksWithMapping()` function in `src/services/strapi.ts` now:
     - Normalizes any existing URLs to use dynamic endpoints
     - Converts any references to `/main.mp3` to `/audio`
     - Converts any references to `/cover.jpg` to `/image`
     - Ensures all tracks returned by the API use these dynamic endpoints

   - **Media Helper Utilities**: The `getTrackCoverImageUrl()` function in `src/utils/media-helpers.ts`:
     - Takes a track object with ID and optional imageUrl properties
     - Falls back to dynamic endpoints if no imageUrl is provided: `/api/direct-s3/tracks/${track.id}/image`
     - Adds cache-busting query parameters to prevent stale images
     - Returns placeholder SVG if no valid ID is available

   - **TrackImage Component**: All components displaying track images consume these normalized URLs,
     ensuring consistent handling across the application

   - **Code Examples**:
     ```tsx
     // Example 1: Track service normalizing URLs
     // From src/services/strapi.ts
     const normalizedImageUrl = trackData.imageUrl?.includes('/cover.jpg') 
       ? `/api/direct-s3/${s3Path}/image` 
       : trackData.imageUrl || imageUrl;
     
     // Example 2: Media helper providing fallback dynamic URL
     // From src/utils/media-helpers.ts
     export function getTrackCoverImageUrl(track: { id?: string, imageUrl?: string }) {
       // If track has an imageUrl, use it
       if (track.imageUrl && track.imageUrl.trim() !== '') {
         return track.imageUrl;
       }
       
       // If track has an id, use the dynamic image endpoint
       if (track.id) {
         return `/api/direct-s3/tracks/${track.id}/image?t=${Date.now()}`;
       }
       
       // Fallback to placeholder
       return "/api/placeholder-image";
     }
     
     // Example 3: Component using dynamic URL
     // From a component like TrackImage.tsx
     <Image 
       src={getTrackCoverImageUrl(track)}
       alt={track.title}
       width={300}
       height={300}
       className="rounded-lg"
     />
     ```

This approach balances the need for consistent API access patterns with the flexibility required for real-world content management, where files might be named inconsistently or exist in different formats.
