# Audio Platform Migration Plan

## Website Overview
A modern, scalable royalty-free music platform with a focus on user experience and performance.

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

## Current State
- We have a Next.js frontend with an audio player that handles tracks and stems
- Currently using Strapi as the CMS
- Need to migrate to a more scalable solution with S3/CDN integration

## Migration Goals
1. Separate track and stem management
2. Implement direct S3/CDN uploads
3. Automate metadata extraction
4. Make Strapi the central source of truth for:
   - Track/stem relationships
   - User data and permissions
   - E-commerce data (purchases, carts)
   - Tag management
   - Analytics and usage tracking

## Content Types Created

### Track
- Core metadata (title, description, BPM, duration)
- File information (URLs, size, format)
- Analytics (play count, download count)
- SEO fields
- Relationships to stems and tags
- Waveform data storage

### Stem
- Core metadata (name, type, description)
- E-commerce fields (price, SKU, availability)
- File information (URLs, size, format)
- Analytics (purchase count, preview count)
- Relationship to parent track

### Tag
- Categorization (name, type)
- Description
- SEO fields
- Many-to-many relationship with tracks

### Upload Batch
- Status tracking
- Progress monitoring
- Error logging
- Relationship to processed tracks

## Next Steps
1. Create upload interface
2. Implement metadata extraction service
3. Set up e-commerce integration

## Progress
✅ Created content type schemas
✅ Created controllers and services
⬜ Set up S3/CDN integration (AWS setup pending)
⬜ Created upload interface
⬜ Implemented metadata extraction
⬜ Set up e-commerce integration

## Implementation Details

### Controllers Created
1. Track Controller
   - CRUD operations
   - Analytics tracking (play count, download count)
   - Bulk creation support

2. Stem Controller
   - CRUD operations
   - Analytics tracking (preview count, purchase count)
   - Bulk creation support

### Services Created
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

### S3/CDN Integration
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