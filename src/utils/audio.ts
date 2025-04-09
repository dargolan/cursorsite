import { Stem } from '../types';

/**
 * Calculates the total and discounted price for a collection of stems
 */
export function calculateStemPrices(stems: Stem[] | undefined) {
  if (!stems || stems.length === 0) {
    return { totalPrice: 0, discountedPrice: 0 };
  }
  
  const totalPrice = stems.reduce((sum, stem) => sum + (stem.price || 0), 0);
  // Apply 25% discount for bundle
  const discountedPrice = Math.floor(totalPrice * 0.75 * 100) / 100;
  
  return { totalPrice, discountedPrice };
}

/**
 * Convert audio data to a waveform-friendly format
 * Returns an array of normalized values (between 0 and 1)
 */
export function createWaveformData(audioBuffer: AudioBuffer, numPoints: number = 100): number[] {
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const blockSize = Math.floor(channelData.length / numPoints);
  const waveform = [];
  
  for (let i = 0; i < numPoints; i++) {
    const start = blockSize * i;
    let sum = 0;
    
    // Find peak value in this block
    for (let j = 0; j < blockSize; j++) {
      const value = Math.abs(channelData[start + j] || 0);
      sum = Math.max(sum, value);
    }
    
    // Add normalized value to waveform data
    waveform.push(sum);
  }
  
  // Normalize to 0-1 range
  const max = Math.max(...waveform, 0.01); // Avoid division by zero
  return waveform.map(val => val / max);
}

/**
 * Creates a bundle ID from a track ID
 */
export function createBundleId(trackId: string): string {
  return `bundle_${trackId}`;
}

/**
 * Creates a stem cart item ID from a stem ID
 */
export function createStemCartItemId(stemId: string): string {
  return `stem_${stemId}`;
} 