# Remaining Stem System Cleanup Tasks

This document outlines the remaining stem references that need to be removed from the codebase to complete the stem system cleanup.

## Component Files to Update/Remove

1. **AudioPlayer Components**
   - `/src/components/AudioPlayer/index.tsx` - Remove all stem references, imports, and functionality
   - `/src/components/AudioPlayer/StemPlayer.tsx` - Delete this file
   - `/src/components/AudioPlayer/StemControls.tsx` - Delete this file

2. **Other Components**
   - `/src/components/FileUpload.tsx` - Remove stem fileType option
   - `/src/components/AudioStatusIndicator.tsx` - Remove stem status tracking
   - `/src/components/audio/StemList.tsx` - Delete this file
   - `/src/components/audio/AudioPlayer.tsx` - Remove stem imports and functionality
   - `/src/components/checkout/DownloadButton.tsx` - Remove stem parameters and references
   - `/src/components/checkout/StripeCheckout.tsx` - Remove stem parameters and references
   - `/src/components/checkout/AddToCartButton.tsx` - Remove stem parameters and references

## Hooks to Update/Remove

1. **Stem-Specific Hooks**
   - `/src/hooks/useStemManagement.ts` - Delete this file
   - `/src/hooks/useStemPlayer.ts` - Delete this file

2. **Other Hooks with Stem References**
   - `/src/hooks/useAudioPlayback.ts` - Remove stemId references and related functionality
   - `/src/hooks/useUnifiedAudioPlayer.ts` - Remove stemId references and stem-specific event listeners

## Utilities and Libraries to Update/Remove

1. **Stem-Specific Utilities**
   - `/src/lib/stem-manager.ts` - Delete this file
   - `/src/utils/stem-url-manager.ts` (if exists) - Delete this file

2. **Utilities with Stem References**
   - `/src/lib/audio.ts` - Remove stem key detection

## API Routes to Update/Remove

1. **Stem-Specific API Routes**
   - `/src/app/api/download/[stemId]/route.ts` - Delete this file

2. **API Routes with Stem References**
   - `/src/app/api/tracks/create/route.ts` - Remove stem data handling
   - `/src/app/api/upload/route.ts` - Remove stem upload path creation
   - `/src/app/api/verify-payment/route.ts` - Remove stem verification
   - `/src/app/api/webhooks/route.ts` - Remove stem access handling
   - `/src/app/api/webhooks/stripe/route.ts` - Remove stem purchase processing

## Page Components to Update

1. **Pages with Stem Imports**
   - `/src/app/explore/page.tsx` - Remove Stem import
   - `/src/app/page.tsx.new` - Remove Stem import

## Data Files to Update

1. **JSON Data Files**
   - `/tracks.json` - Remove stems array from all tracks
   - `/tracks.json.backup` - Remove stems array
   - `/tracks.json.modified` - Remove stems array

## Next Steps

1. Start by removing/updating the core components and hooks
2. Update the API routes to remove stem handling
3. Update page components to remove stem imports
4. Clean up data files by removing stem arrays
5. Finally, verify all stem functionality has been completely removed by testing the application

## Additional Considerations

- When removing stem functionality from components, make sure to preserve the base audio player functionality
- Update any component prop types to remove stem-related parameters
- Check for any remaining TypeScript errors after removing stem references
- Ensure cart functionality works properly after removing stem cart operations 