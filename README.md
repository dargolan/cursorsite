# WaveCave Audio Marketplace

A marketplace platform for musicians to buy and sell individual stems from audio tracks.

## Cart System Update (April 20, 2025)

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

## Performance Improvements (April 10, 2025)

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

These changes have significantly improved the codebase maintainability and application performance.

## Tag System Refactor (May 2025)

The tag selection system has been refactored to use Tag objects throughout the codebase:

- The `TagSelector` component and all tag-related state now use `Tag` objects (with `id`, `name`, and `type`) instead of plain strings.
- This change improves filtering, display, and backend integration for tags.
- The upload page and any future tag-related features now expect and handle Tag objects.
- Predefined tags are now objects, and custom tags are supported with full metadata.

## Progress Since Latest Environment Update (May 2025)

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

- **Environment variables**: Updated `.env.local` to set Strapi API and Media URLs, which are now used by the app and proxy for all media and API requests.
- **AWS S3 Configuration**: Set up multiple S3 buckets for the project:
  - `dargo-music-library`: Initial music library storage
  - `dargo-strapi-media`: Strapi CMS media storage
  - `wave-cave-audio`: Production audio files (selected as primary bucket)
  - `wave-cave-audio-dev`: Development environment audio files
- **Tag system refactor**: Migrated the tag system to use Tag objects throughout the codebase. The `TagSelector` component and all tag-related state now use `Tag` objects (`id`, `name`, `type`) instead of strings. This improves filtering, display, and backend integration for tags. The upload page and any future tag-related features now expect and handle Tag objects.
- **Documentation**: Updated both `README.md` and `DOCUMENTATION.md` to reflect the tag system migration and environment changes.
- **Migration plan**: Added a comprehensive website overview and executed a step-by-step migration plan for the tag system.
- **Development servers**: Started the Next.js development server and Strapi backend. The app is running and proxying requests to Strapi. Proxy errors for missing media files were observed, but the main application and tag system refactor are functioning as intended.

## Dynamic Genre Images from Strapi (May 2025)

The homepage now dynamically displays genre images fetched from Strapi, with no hardcoding or local images. The normalization logic in `getTags` was updated to support both Strapi v4+ (where the `image` field is an array directly on the tag object) and older Strapi formats (where the image is nested under `attributes`).

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