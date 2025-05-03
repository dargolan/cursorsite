/**
 * Audio helper utilities for the WaveCave marketplace
 * This version has been simplified to remove stem functionality
 */

/**
 * Gets the track audio URL
 * @param track The track object or track ID
 */
export function getTrackAudioUrl(track: any): string {
  // Simple passthrough of the audioUrl property if it exists
  if (track && track.audioUrl) {
    return track.audioUrl;
  }
  
  // Fallback to the API route
  const trackId = typeof track === 'string' ? track : track?.id;
  if (trackId) {
    return `/api/track-audio/${trackId}`;
  }
  
  return '';
}

/**
 * Format duration from seconds to MM:SS format
 * @param seconds Total seconds
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculates percentage position based on current time and duration
 */
export function calculateProgress(currentTime: number, duration: number): number {
  if (!duration) return 0;
  return (currentTime / duration) * 100;
}
