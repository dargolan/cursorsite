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

## Dynamic Genre Images from Strapi (May 2025)

The homepage now dynamically displays genre images fetched from Strapi, with no hardcoding or local images. The normalization logic for genres supports both Strapi v4+ (where the `image` field is an array directly on the tag object) and older Strapi formats (where the image is nested under `attributes`).

**Key implementation details:**
- The code checks for `item.image` (current Strapi API) and falls back to `item.attributes?.image` (older style).
- If the image is an array, the first image is used.
- If the image is an object with a `data` property, the first image in `data` is used.
- The image URL is normalized and passed to the frontend for display.

**Example normalization logic:**
```js
const img = item.image || item.attributes?.image;
if (!img) return null;
if (Array.isArray(img) && img.length > 0) {
  return { url: toCdnUrl(getStrapiMedia(String(img[0]?.url || ''))) };
}
if (img.data) {
  const imgData = Array.isArray(img.data) ? img.data[0] : img.data;
  return { url: toCdnUrl(getStrapiMedia(String(imgData?.attributes?.url || ''))) };
}
return null;
```

This ensures that all genres with images in Strapi will display their images on the homepage, regardless of the Strapi version or API response format.

## Infrastructure and Media Delivery

### CDN, CloudFront, and CORS Architecture (2024 Update)

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

#### CORS/COEP Implementation and Troubleshooting (2025 Update)

**Problem:**
Despite implementing the CloudFront CDN architecture described above, we encountered persistent CORS/COEP issues with certain image assets. Browsers were throwing `ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep` errors when attempting to load images directly from S3 URLs, even though we had configured CloudFront with the necessary headers.

**Root Causes Identified:**
1. **Inconsistent URL transformation:** Some components weren't consistently using the `toCdnUrl` utility function, resulting in direct S3 URL exposure to the browser.
2. **Missing crossOrigin attributes:** HTML `<img>` tags lacked the `crossOrigin="anonymous"` attribute needed for CORS requests.
3. **Fallback to direct S3 URLs:** In certain scenarios (especially with track cover images), the code would fall back to using direct S3 URLs when CloudFront transformation failed.

**Comprehensive Solution:**

1. **Component Image Handling Updates:**
   - Updated all components that display track images to consistently use the `toCdnUrl` function:
     - `src/components/AudioPlayer.tsx` - Added crossOrigin attribute to img tag and ensured proper URL transformation:
       ```tsx
       <img 
         src={trackImageUrl} 
         alt={track.title}
         className="object-cover w-14 h-14"
         crossOrigin="anonymous"
         onError={(e) => {
           console.error(`[AudioPlayer] Failed to load image: ${trackImageUrl}`);
           setImageLoadFailed(true);
         }}
       />
       ```
     - `src/components/track/TrackImage.tsx` - Ensured proper URL transformation:
       ```tsx
       <Image
         src={track.imageUrl ? toCdnUrl(track.imageUrl) : '/placeholder-image.jpg'}
         alt={`${track.title} cover`}
         fill
         sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
         className={`object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-80' : 'group-hover:opacity-80'}`}
       />
       ```
     - `src/components/TrackListItem.tsx`
     - `src/components/AudioPlayer/TrackInfo.tsx`
     - `src/components/Header.tsx` - For cart item images:
       ```tsx
       <Image
         src={toCdnUrl(item.imageUrl)}
         alt={item.name}
         width={40}
         height={40}
         className="rounded"
       />
       ```

2. **Audio & Download URL Handling:**
   - Updated download functionality to use `toCdnUrl` for audio URLs in `src/components/AudioPlayer.tsx`:
     ```tsx
     const audioUrl = track.audioUrl ? toCdnUrl(track.audioUrl) : '';
     if (!audioUrl) {
       console.error('[AudioPlayer] No audio URL available for download');
       return;
     }
     
     const response = await fetch(audioUrl);
     const blob = await response.blob();
     ```
   - Added proper URL transformation in stem components:
     - `src/components/stem/StemItem.tsx`:
       ```tsx
       const handleAddToCart = () => {
         addItem({
           id: stem.id,
           name: stem.name,
           trackName: track.title,
           price: stem.price,
           imageUrl: track.imageUrl ? toCdnUrl(track.imageUrl) : '',
           type: 'stem'
         });
       };
       ```
     - `src/components/stem/StemContainer.tsx`

3. **Dynamic Approach to URL Handling:**
   Instead of hardcoding specific transformations, we implemented a fully dynamic approach using the `toCdnUrl` utility function from `src/utils/cdn-url.ts`:
   ```typescript
   import { CDN_DOMAIN, S3_DOMAIN } from './constants';

   export function isCdnUrl(url: string): boolean {
     if (!url) return false;
     return url.includes(CDN_DOMAIN);
   }

   export function toCdnUrl(url: string): string {
     if (!url) return '';
     if (isCdnUrl(url)) return url; // Already a CDN URL
     if (url.includes(S3_DOMAIN)) {
       return url.replace(S3_DOMAIN, CDN_DOMAIN);
     }
     return url; // Not an S3 URL, return as is
   }
   ```

**Testing and Verification:**
- Verified that all track images load properly with the implemented changes
- Confirmed that audio tracks play and download without CORS errors
- Ensured proper fallback behavior when images fail to load
- Checked browser console for any remaining CORS/COEP errors

**Key Technical Insights:**
1. The browser error `ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep` indicates a mismatch between the Cross-Origin-Embedder-Policy and the Cross-Origin-Resource-Policy headers.
2. The `crossOrigin="anonymous"` attribute is required on all `<img>` tags loading external resources when COEP headers are present.
3. Converting S3 URLs to CloudFront URLs must be done consistently throughout the application, with no exceptions.
4. Error handling with proper fallbacks is essential, as network errors can still occur even with correct CORS configuration.

**Future Troubleshooting Guidelines:**
If CORS/COEP issues reappear, check the following:

1. Verify that all image rendering components use the `toCdnUrl` utility:
   ```tsx
   import { toCdnUrl } from '../utils/cdn-url';
   
   // Later in the component:
   <img src={toCdnUrl(imageUrl)} crossOrigin="anonymous" />
   ```

2. Confirm that CloudFront is properly configured with all required headers:
   - Navigate to AWS CloudFront console
   - Check the distribution's behavior settings
   - Verify origin response header policy includes all six CORS/COEP headers

3. Check for any direct S3 URL references using grep:
   ```
   grep -r "s3\..*amazonaws\.com" --include="*.tsx" --include="*.ts" src/
   ```

4. For media elements, ensure they have proper crossOrigin attributes:
   ```tsx
   <img crossOrigin="anonymous" />
   <audio crossOrigin="anonymous" />
   ```

5. Examine network requests in the browser's developer tools to identify which specific resources are triggering CORS errors

6. Verify that the CDN_DOMAIN and S3_DOMAIN constants are correctly set in environment variables

By following these guidelines and maintaining a consistent approach to media URL handling, the platform can avoid future CORS/COEP issues even as browsers continue to strengthen their cross-origin policies.

# Appendix: AudioPlayer Component (Current Implementation)
Below is the main component and its props as of 05-MAY-2025. Update this section if the implementation changes.

     ```tsx
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
```

## Data Backup Strategy (2024)

To ensure the safety and integrity of our Strapi content, we've implemented a comprehensive backup system.

### Backup Implementation

1. **Automated Backup Script**
   - Located in `scripts/backup-strapi.js`
   - Creates timestamped backups of:
     - SQLite database
     - Uploaded files
     - Compressed into a single zip file
   - Run manually with: `npm run backup` in the Strapi backend directory

2. **Backup Contents**
   - Database file (`.tmp/data.db`)
   - Uploaded media files (`public/uploads/`)
   - Timestamp in filename format: `strapi-backup-YYYY-MM-DDTHH-mm-ss-sssZ.zip`

3. **Storage Location**
   - Backups stored in project root's `backups/` directory
   - Each backup is a self-contained zip file
   - Recommended to copy backups to secure cloud storage

### Future Improvements

1. **Automated Scheduling**
   - Set up daily automated backups using:
     - Windows Task Scheduler
     - Linux/Mac cron jobs
   - Configure backup retention policy

2. **Cloud Storage Integration**
   - Implement automatic upload to:
     - AWS S3
     - Google Cloud Storage
     - Dropbox
   - Add backup rotation/cleanup

3. **Database Migration**
   - Plan migration from SQLite to PostgreSQL/MySQL
   - Implement database replication
   - Set up point-in-time recovery

4. **Backup Verification**
   - Add automated backup testing
   - Implement backup integrity checks
   - Create backup restoration documentation

5. **Monitoring and Alerts**
   - Set up backup success/failure notifications
   - Monitor backup storage usage
   - Implement backup health checks

### Restore Process

To restore from a backup:
1. Stop Strapi server
2. Unzip backup file
3. Copy `database.db` to `.tmp/` directory
4. Copy `uploads/` to `public/` directory
5. Restart Strapi server
