// Utility functions and managers extracted from AudioPlayer.tsx
import { STRAPI_URL } from '../config/strapi';
import { findFileInStrapiByName } from '../utils/strapi-helpers';

export const globalAudioManager = {
  activeAudio: null as HTMLAudioElement | null,
  activeStemId: null as string | null,
  activeTrackId: null as string | null,
  play(audio: HTMLAudioElement, info?: { stemId?: string, trackId?: string }) {
    if (this.activeAudio && this.activeAudio !== audio && !this.activeAudio.paused) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      if (this.activeStemId) {
        const event = new CustomEvent('stem-stopped', {
          detail: { stemId: this.activeStemId, trackId: this.activeTrackId }
        });
        document.dispatchEvent(event);
      }
    }
    this.activeAudio = audio;
    this.activeStemId = info?.stemId || null;
    this.activeTrackId = info?.trackId || null;
    audio.play().catch(err => { console.error('Error playing audio:', err); });
  },
  stop() {
    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause();
      if (this.activeStemId) {
        const event = new CustomEvent('stem-stopped', {
          detail: { stemId: this.activeStemId, trackId: this.activeTrackId }
        });
        document.dispatchEvent(event);
      }
    }
    this.activeAudio = null;
    this.activeStemId = null;
    this.activeTrackId = null;
  }
};

export const stemUrlCache: Record<string, string> = {};
export function saveStemUrlToCache(trackTitle: string, stemName: string, url: string) {
  const cacheKey = `${trackTitle}:${stemName}`;
  stemUrlCache[cacheKey] = url;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existingCache = localStorage.getItem('stemUrlCache');
      const cache = existingCache ? JSON.parse(existingCache) : {};
      cache[cacheKey] = url;
      localStorage.setItem('stemUrlCache', JSON.stringify(cache));
    }
  } catch (e) { console.warn('Failed to save to localStorage:', e); }
}

export async function listAllStrapiFiles() {
  try {
    const apiUrl = `${STRAPI_URL}/api/upload/files`;
    const response = await fetch(apiUrl);
    if (response.ok) {
      const files = await response.json();
      // ... (omitted for brevity, include grouping and logging logic as needed)
    }
  } catch (error) { console.error('[DEBUG] Error listing Strapi files:', error); }
}

export async function discoverStemUrl(stemName: string, trackTitle: string): Promise<string> {
  // ... (copy the full logic from AudioPlayer.tsx)
}

export const ELEVATOR_MUSIC_STEM_HASHES: Record<string, string> = { /* ... */ };
export const CRAZY_MEME_MUSIC_STEM_HASHES: Record<string, string> = { /* ... */ };
export const LOFI_BEATS_STEM_HASHES: Record<string, string> = { /* ... */ };
export const DRAMATIC_EPIC_CINEMA_STEM_HASHES: Record<string, string> = { /* ... */ };

export function getHash(stemName: string, trackTitle: string): string { /* ... */ }
export function fallbackGetStemUrl(stemName: string, trackTitle: string): string { /* ... */ }
export function getConsistentStemUrl(stemName: string, trackTitle: string): string { /* ... */ }
export async function findStemFileUrl(stemName: string, trackTitle: string): Promise<string | null> { /* ... */ }
export function getStemUrl(stemName: string, trackTitle: string): string { /* ... */ }
export async function urlExists(url: string): Promise<boolean> { /* ... */ }
export async function findFirstValidUrl(urls: string[]): Promise<string | null> { /* ... */ }
export async function getValidUrl(stemName: string, trackTitle: string): Promise<string | null> { /* ... */ } 