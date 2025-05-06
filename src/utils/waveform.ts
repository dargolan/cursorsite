import { toCdnUrl } from './cdn-url';

export function getWaveformUrl(audioUrl: string): string {
  // Replace audio extension with .waveform.json
  const jsonUrl = audioUrl.replace(/\.(mp3|wav|flac|ogg|m4a)$/i, '.waveform.json');
  // Always return the CDN URL
  return toCdnUrl(jsonUrl);
} 