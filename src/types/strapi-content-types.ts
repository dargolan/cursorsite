// Track content type
export interface Track {
  id: string;
  title: string;
  description?: string;
  bpm: number;
  duration: number;
  imageUrl: string;
  audioUrl: string; // Direct S3/CDN URL for the main track
  waveform?: number[]; // Array of waveform data points
  tags: Tag[];
  stems: Stem[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  // Analytics
  playCount: number;
  downloadCount: number;
  // Metadata
  key?: string; // Musical key
  genre?: string;
  mood?: string;
  instruments?: string[];
  // File management
  fileSize: number;
  fileFormat: string;
  // SEO
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
}

// Stem content type
export interface Stem {
  id: string;
  name: string;
  type: string; // e.g., "drums", "bass", "vocals"
  description?: string;
  price: number;
  duration: number;
  audioUrl: string; // Direct S3/CDN URL for the stem
  track: Track; // Reference to parent track
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  // Analytics
  purchaseCount: number;
  previewCount: number;
  // File management
  fileSize: number;
  fileFormat: string;
  // E-commerce
  isAvailable: boolean;
  sku?: string;
  // SEO
  slug: string;
}

// Tag content type
export interface Tag {
  id: string;
  name: string;
  type: 'genre' | 'mood' | 'instrument' | 'style';
  description?: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  // SEO
  slug: string;
}

// User content type (for e-commerce)
export interface User {
  id: string;
  email: string;
  username: string;
  purchases: Purchase[];
  createdAt: string;
  updatedAt: string;
}

// Purchase content type
export interface Purchase {
  id: string;
  user: User;
  stems: Stem[];
  totalAmount: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

// Upload Batch content type (for tracking bulk uploads)
export interface UploadBatch {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  tracks: Track[];
  totalFiles: number;
  processedFiles: number;
  errorCount: number;
  startedAt: string;
  completedAt?: string;
  errorLog?: string;
  createdAt: string;
  updatedAt: string;
}

// Content Type Collections
export interface StrapiContentTypes {
  track: Track;
  stem: Stem;
  tag: Tag;
  user: User;
  purchase: Purchase;
  uploadBatch: UploadBatch;
} 