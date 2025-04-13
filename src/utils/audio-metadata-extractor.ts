import * as mm from 'music-metadata';
import { IAudioMetadata } from 'music-metadata';

export interface TrackMetadata {
  duration: number;
  bpm?: number;
  waveform: number[];
}

export interface StemMetadata {
  name: string;
  trackId?: string; // Reference to parent track
}

/**
 * Extracts only the required metadata for tracks
 */
export async function extractTrackMetadata(file: File): Promise<TrackMetadata> {
  const buffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(buffer);
    
    // Generate waveform data
    const waveform = await generateWaveformData(audioBuffer);
    
    // Detect BPM
    const bpm = await detectBPM(audioBuffer);
    
    return {
      duration: audioBuffer.duration,
      bpm,
      waveform
    };
  } finally {
    await audioContext.close();
  }
}

/**
 * Generates waveform data from an audio buffer
 */
async function generateWaveformData(audioBuffer: AudioBuffer): Promise<number[]> {
  const channelData = audioBuffer.getChannelData(0); // Get the first channel
  const samples = 200; // Number of points in the waveform
  const blockSize = Math.floor(channelData.length / samples);
  const waveform = [];

  for (let i = 0; i < samples; i++) {
    const start = blockSize * i;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j]);
    }
    waveform.push(sum / blockSize);
  }

  // Normalize waveform data to 0-1 range
  const max = Math.max(...waveform);
  return waveform.map(w => w / max);
}

/**
 * Attempts to detect BPM using peak detection
 */
async function detectBPM(audioBuffer: AudioBuffer): Promise<number | undefined> {
  try {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Convert to mono if needed and get amplitude envelope
    const envelope = getAmplitudeEnvelope(channelData, sampleRate);
    
    // Find peaks in the envelope
    const peaks = findPeaks(envelope);
    
    // Calculate intervals between peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }
    
    // Convert intervals to BPM candidates
    const bpmCandidates = intervals.map(interval => 60 / (interval / sampleRate));
    
    // Filter out unreasonable BPM values and find the most common one
    const filteredBPMs = bpmCandidates.filter(bpm => bpm >= 60 && bpm <= 200);
    
    if (filteredBPMs.length === 0) return undefined;
    
    // Return the median BPM
    filteredBPMs.sort((a, b) => a - b);
    const medianBPM = filteredBPMs[Math.floor(filteredBPMs.length / 2)];
    
    // Round to nearest integer
    return Math.round(medianBPM);
  } catch (error) {
    console.error('BPM detection failed:', error);
    return undefined;
  }
}

/**
 * Gets the amplitude envelope of the audio signal
 */
function getAmplitudeEnvelope(channelData: Float32Array, sampleRate: number): Float32Array {
  const envelopeSize = Math.floor(channelData.length / 1024);
  const envelope = new Float32Array(envelopeSize);
  
  for (let i = 0; i < envelopeSize; i++) {
    const start = i * 1024;
    let max = 0;
    for (let j = 0; j < 1024; j++) {
      const abs = Math.abs(channelData[start + j]);
      if (abs > max) max = abs;
    }
    envelope[i] = max;
  }
  
  return envelope;
}

/**
 * Finds peaks in the amplitude envelope
 */
function findPeaks(envelope: Float32Array): number[] {
  const peaks: number[] = [];
  const lookAhead = 10; // Number of samples to look ahead/behind
  const threshold = 0.5; // Minimum amplitude for a peak
  
  for (let i = lookAhead; i < envelope.length - lookAhead; i++) {
    const current = envelope[i];
    if (current < threshold) continue;
    
    let isPeak = true;
    for (let j = 1; j <= lookAhead; j++) {
      if (envelope[i - j] > current || envelope[i + j] > current) {
        isPeak = false;
        break;
      }
    }
    
    if (isPeak) {
      peaks.push(i);
    }
  }
  
  return peaks;
} 