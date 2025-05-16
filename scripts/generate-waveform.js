// scripts/generate-waveform.js

/**
 * Usage:
 *   node scripts/generate-waveform.js <input-audio-file> <output-json-file>
 *
 * Example:
 *   node scripts/generate-waveform.js ./audio/track1.mp3 ./audio/track1.waveform.json
 *
 * This script reads an audio file (MP3, WAV, etc.), extracts waveform peaks,
 * and writes a compact JSON file suitable for frontend waveform rendering.
 */

const fs = require('fs');
const path = require('path');
const audioDecode = require('audio-decode');
const WaveformData = require('waveform-data');

async function main() {
  const [,, inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/generate-waveform.js <input-audio-file> <output-json-file>');
    process.exit(1);
  }

  const audioBuffer = fs.readFileSync(inputPath);
  let decoded;
  try {
    decoded = await audioDecode(audioBuffer);
  } catch (err) {
    console.error('Error decoding audio:', err);
    process.exit(1);
  }

  // Generate waveform data (512 samples for compactness)
  const waveform = WaveformData.create(decoded, {
    samples: 512,
    scale: 1,
  });

  // Extract peaks as an array
  const peaks = [];
  for (let i = 0; i < waveform.length; i++) {
    peaks.push(waveform.channel(0).max_sample(i));
  }

  // Write to output JSON file
  fs.writeFileSync(outputPath, JSON.stringify({
    peaks,
    length: waveform.length,
    sample_rate: waveform.sample_rate,
    duration: decoded.duration
  }, null, 2));

  console.log(`Waveform data written to ${outputPath}`);
}

main(); 