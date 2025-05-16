/**
 * Usage:
 *   node scripts/generate-s3-waveforms.js <bucket-name> [audio-folder-prefix]
 *
 * Example:
 *   node scripts/generate-s3-waveforms.js wave-cave-audio uploads/tracks/
 *
 * This script scans an S3 bucket for audio files, generates waveform JSONs for any missing,
 * and uploads them back to S3. No hardcoding, fully dynamic.
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const os = require('os');
const path = require('path');
const audioDecode = require('audio-decode').default;

const s3 = new AWS.S3();

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.ogg', '.m4a'];

async function listAllObjects(bucket, prefix) {
  let isTruncated = true;
  let marker;
  const objects = [];
  while (isTruncated) {
    const params = { Bucket: bucket, Prefix: prefix };
    if (marker) params.Marker = marker;
    const response = await s3.listObjects(params).promise();
    objects.push(...response.Contents);
    isTruncated = response.IsTruncated;
    if (isTruncated) {
      marker = response.Contents.slice(-1)[0].Key;
    }
  }
  return objects;
}

function isAudioFile(key) {
  return AUDIO_EXTENSIONS.some(ext => key.toLowerCase().endsWith(ext));
}

function waveformKeyForAudio(key) {
  return key.replace(/\.[^/.]+$/, '.waveform.json');
}

async function downloadS3Object(bucket, key, destPath) {
  const file = fs.createWriteStream(destPath);
  return new Promise((resolve, reject) => {
    s3.getObject({ Bucket: bucket, Key: key })
      .createReadStream()
      .pipe(file)
      .on('finish', () => resolve(destPath))
      .on('error', reject);
  });
}

async function uploadS3Object(bucket, key, filePath) {
  const body = fs.readFileSync(filePath);
  await s3.putObject({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/json' }).promise();
}

function floatTo16BitPCM(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

async function generateWaveformJson(audioPath, outputPath) {
  const audioBuffer = fs.readFileSync(audioPath);
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
  fs.writeFileSync(outputPath, JSON.stringify({
    peaks,
    duration: decoded.duration,
    sampleRate: decoded.sampleRate,
    numberOfChannels: decoded.numberOfChannels
  }, null, 2));
}

async function main() {
  const [,, bucket, prefix = ''] = process.argv;
  if (!bucket) {
    console.error('Usage: node scripts/generate-s3-waveforms.js <bucket-name> [audio-folder-prefix]');
    process.exit(1);
  }
  console.log(`Listing audio files in s3://${bucket}/${prefix}`);
  const objects = await listAllObjects(bucket, prefix);
  const audioFiles = objects.filter(obj => isAudioFile(obj.Key));
  console.log(`Found ${audioFiles.length} audio files.`);

  for (const obj of audioFiles) {
    const audioKey = obj.Key;
    const waveformKey = waveformKeyForAudio(audioKey);
    const waveformExists = objects.some(o => o.Key === waveformKey);
    if (waveformExists) {
      console.log(`[SKIP] Waveform exists for ${audioKey}`);
      continue;
    }
    console.log(`[PROCESS] Generating waveform for ${audioKey}`);
    // Download audio to temp file
    const tmpAudio = path.join(os.tmpdir(), path.basename(audioKey));
    const tmpWaveform = path.join(os.tmpdir(), path.basename(waveformKey));
    try {
      await downloadS3Object(bucket, audioKey, tmpAudio);
      await generateWaveformJson(tmpAudio, tmpWaveform);
      await uploadS3Object(bucket, waveformKey, tmpWaveform);
      console.log(`[DONE] Uploaded waveform for ${audioKey} as ${waveformKey}`);
    } catch (err) {
      console.error(`[ERROR] Processing ${audioKey}:`, err);
    } finally {
      if (fs.existsSync(tmpAudio)) fs.unlinkSync(tmpAudio);
      if (fs.existsSync(tmpWaveform)) fs.unlinkSync(tmpWaveform);
    }
  }
  console.log('All done!');
}

main(); 