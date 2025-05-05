/**
 * Analyzes an audio file to detect its BPM (beats per minute)
 * Uses a basic peak detection algorithm on audio data
 */
export async function analyzeBPM(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error('Failed to read file'));
          return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Decode the audio file
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get the audio data - use the first channel
        const audioData = audioBuffer.getChannelData(0);
        
        // Calculate BPM using a simple peak detection algorithm
        const bpm = detectBPM(audioData, audioBuffer.sampleRate);
        
        resolve(bpm);
      } catch (error) {
        console.error('BPM analysis error:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    // Read the file as an array buffer
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get audio file duration in seconds
 * Returns the precise duration of an audio file using the Web Audio API
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error('Failed to read file'));
          return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Decode the audio file
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // The duration is available directly on the audioBuffer
        resolve(audioBuffer.duration);
      } catch (error) {
        console.error('Audio duration analysis error:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    // Read the file as an array buffer
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Simple BPM detection using peak detection
 * This is a basic implementation and could be improved with more sophisticated algorithms
 */
function detectBPM(audioData: Float32Array, sampleRate: number): number {
  // The minimum and maximum BPM we'll consider
  const MIN_BPM = 60;
  const MAX_BPM = 180;
  
  // Find peaks in the audio data (beats)
  const peaks = findPeaks(audioData, sampleRate);
  
  // If we found very few peaks, return a default BPM
  if (peaks.length < 4) {
    return 120; // Default BPM
  }
  
  // Calculate time intervals between peaks
  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }
  
  // Get the average interval in seconds
  const averageInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  
  // Convert to BPM (beats per minute = 60 seconds / seconds per beat)
  let bpm = 60 / averageInterval;
  
  // Adjust BPM if it's outside our expected range
  // Sometimes the algorithm picks up half or double tempo
  while (bpm < MIN_BPM) bpm *= 2;
  while (bpm > MAX_BPM) bpm /= 2;
  
  // Round to nearest integer
  return Math.round(bpm);
}

/**
 * Find peaks (likely beats) in audio data
 */
function findPeaks(audioData: Float32Array, sampleRate: number): number[] {
  const peaks: number[] = [];
  
  // We'll use a basic threshold for peak detection
  // This could be made more sophisticated with adaptive thresholding
  const THRESHOLD = 0.7;
  
  // Window size for peak detection (in seconds)
  const WINDOW_SIZE = 0.2;
  const windowSamples = Math.floor(WINDOW_SIZE * sampleRate);
  
  // Find the signal's maximum amplitude for normalization
  let max = 0;
  for (let i = 0; i < audioData.length; i++) {
    const amplitude = Math.abs(audioData[i]);
    if (amplitude > max) {
      max = amplitude;
    }
  }
  
  // Find peaks that exceed the threshold
  let lastPeakIndex = -1;
  
  for (let i = 0; i < audioData.length; i++) {
    const amplitude = Math.abs(audioData[i]) / max; // Normalize
    
    // Check if this is a local maximum that exceeds our threshold
    if (amplitude > THRESHOLD) {
      let isPeak = true;
      
      // Check in a window to see if this is a local maximum
      for (let j = Math.max(0, i - windowSamples); j < Math.min(audioData.length, i + windowSamples); j++) {
        if (j !== i && Math.abs(audioData[j]) / max > amplitude) {
          isPeak = false;
          break;
        }
      }
      
      if (isPeak && (lastPeakIndex === -1 || i - lastPeakIndex > windowSamples)) {
        peaks.push(i / sampleRate); // Convert to seconds
        lastPeakIndex = i;
      }
    }
  }
  
  return peaks;
} 