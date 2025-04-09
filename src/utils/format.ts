/**
 * Format time in mm:ss format
 */
export function formatTime(time: number): string {
  if (isNaN(time) || !isFinite(time)) return '0:00';
  
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currency: string = '€'): string {
  return `${price.toFixed(2)}${currency}`;
}

/**
 * Format filesize to readable form
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 