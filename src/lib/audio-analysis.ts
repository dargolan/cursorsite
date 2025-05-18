import { parseFile } from 'music-metadata';
import fs from 'fs';
import audioDecode from 'audio-decode';

/**
 * Extracts duration and waveform data from an audio file using pure JS (no audiowaveform CLI).
 * @param filePath Path to the local audio file
 * @returns { duration: number, waveform: number[] }
 */
export async function extractAudioFeatures(filePath: string): Promise<{ duration: number, waveform: number[] }> {
  // 1. Extract duration using music-metadata
  const metadata = await parseFile(filePath);
  const duration = metadata.format.duration || 0;

  // 2. Generate waveform data using audio-decode
  const audioBuffer = fs.readFileSync(filePath);
  const decoded = await audioDecode(audioBuffer);
  const channel = decoded.getChannelData(0); // Use first channel for mono waveform
  const totalSamples = channel.length;
  const numPeaks = 512;
  const samplesPerPeak = Math.floor(totalSamples / numPeaks);
  const peaks = [];
  for (let i = 0; i < numPeaks; i++) {
    let start = i * samplesPerPeak;
    let end = (i + 1) * samplesPerPeak;
    let max = 0;
    for (let j = start; j < end && j < totalSamples; j++) {
      max = Math.max(max, Math.abs(channel[j]));
    }
    peaks.push(max);
  }

  return { duration, waveform: peaks };
} 