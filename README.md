# WaveCave Audio Marketplace

A marketplace platform for musicians to buy and sell individual stems from audio tracks.

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