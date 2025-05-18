import { parseFile } from 'music-metadata';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Extracts duration and waveform data from an audio file.
 * @param filePath Path to the local audio file
 * @returns { duration: number, waveform: number[] }
 */
export async function extractAudioFeatures(filePath: string): Promise<{ duration: number, waveform: number[] }> {
  // 1. Extract duration using music-metadata
  const metadata = await parseFile(filePath);
  const duration = metadata.format.duration || 0;

  // 2. Generate waveform data using audiowaveform CLI
  // Output a JSON file with waveform data
  const waveformJsonPath = filePath + '.waveform.json';
  await new Promise<void>((resolve, reject) => {
    const proc = spawn('audiowaveform', [
      '-i', filePath,
      '-o', waveformJsonPath,
      '--pixels-per-second', '10', // adjust for resolution
      '--output-format', 'json'
    ]);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error('audiowaveform failed'));
    });
    proc.on('error', reject);
  });

  // 3. Read and parse the waveform JSON
  const waveformJson = JSON.parse(fs.readFileSync(waveformJsonPath, 'utf-8'));
  // audiowaveform outputs { "version": 1, "channels": 1, "data": [ ... ] }
  const waveform: number[] = waveformJson.data || [];

  // 4. Clean up temp file
  fs.unlinkSync(waveformJsonPath);

  return { duration, waveform };
} 