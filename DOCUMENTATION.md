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

#### Backend
- ✅ Set up Strapi headless CMS
- ✅ Created content types for tracks, stems, genres, and users
- ✅ Implemented services for track and stem management
- ✅ Added S3 integration for media storage
- ✅ Set up authentication and user management
- ✅ Created content type schemas
- ✅ Created controllers and services

### In Progress

#### Frontend
- 🔄 Finalizing responsive design for mobile devices
- 🔄 Enhancing audio player functionality
- 🔄 Implementing checkout process
- 🔄 Building user profile pages

#### Backend
- 🔄 Finalizing S3 configuration for production
- 🔄 Setting up Stripe payment integration
- 🔄 Implementing analytics for track plays and downloads

### Next Steps

#### Frontend
- ⬜ Add artist/producer profile pages
- ⬜ Implement social sharing features
- ⬜ Add user favorites/collections feature
- ⬜ Build advanced search with audio characteristics

#### Backend
- ⬜ Optimize database queries for performance
- ⬜ Implement caching strategy for popular content
- ⬜ Set up CI/CD pipeline for automated deployment
- ⬜ Add email notification system for purchases and updates
- ⬜ Set up S3/CDN integration (AWS setup pending)
- ⬜ Create upload interface
- ⬜ Implement metadata extraction
- ⬜ Set up e-commerce integration

#### General
- ⬜ Comprehensive testing (unit, integration, e2e)
- ⬜ SEO optimization
- ⬜ Analytics integration
- ⬜ Documentation for API endpoints and component library

## Recent Updates

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
   - Bucket configuration
   - Access credentials
   - Region settings

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