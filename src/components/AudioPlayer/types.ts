import { Tag, Stem, Track } from '../../types';

export interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTagClick: (tag: Tag) => void;
  openStemsTrackId: string | null;
  setOpenStemsTrackId: (id: string | null) => void;
}

export interface StemPlayerProps {
  stem: Stem;
  trackTitle: string;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
  onProgressChange: (progress: number) => void;
  isInCart: boolean;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  hasError: boolean;
  isLoading: boolean;
}

export interface ProgressBarProps {
  progress: number;
  duration: number;
  currentTime: number;
  onProgressChange: (progress: number) => void;
  isInteractive?: boolean;
}

export interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export interface AudioControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onDownload: () => void;
  hasError?: boolean;
} 