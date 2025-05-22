'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Tag, Stem, Track, CartItem } from '../types';
import { STRAPI_URL } from '../config/strapi';
import { findFileInStrapiByName } from '../utils/strapi-helpers';
import { findStemFileUrl as helperFindStemFileUrl } from '../utils/audio-helpers';
import { createAudio, convertUrlToProxyUrl } from '../lib/audio';
import { useCart } from '../contexts/CartContext';
import { getTrackCoverImageUrl } from '../utils/media-helpers';
import PlayButton from './AudioPlayer/PlayButton';
import { getTags } from '../services/strapi';
import { toCdnUrl } from '../utils/cdn-url';
import WaveformProgressBar from './WaveformProgressBar';
import StemsPopup from '@/components/stem/StemPopup';

// Global audio manager to ensure only one audio source plays at a time
export const globalAudioManager = {
  activeAudio: null as HTMLAudioElement | null,
  activeStemId: null as string | null,
  activeTrackId: null as string | null,
  
  // Play an audio element and stop any currently playing audio
  play(audio: HTMLAudioElement, info?: { stemId?: string, trackId?: string }) {
    // Stop any currently playing audio
    if (this.activeAudio && this.activeAudio !== audio && !this.activeAudio.paused) {
      // Reset currentTime if needed
      this.activeAudio.currentTime = 0;
      
      // Dispatch custom event for stem stopped
      if (this.activeStemId) {
        const event = new CustomEvent('stem-stopped', {
          detail: {
            stemId: this.activeStemId,
            trackId: this.activeTrackId
          }
        });
        document.dispatchEvent(event);
      }
    }
    
    // Set new active audio
    this.activeAudio = audio;
    this.activeStemId = info?.stemId || null;
    this.activeTrackId = info?.trackId || null;
    
    // Play the new audio
    audio.play().catch(err => {
      console.error('Error playing audio:', err);
    });
  },
  
  // Stop the currently playing audio
  stop() {
    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause();
      
      // Dispatch custom event if it's a stem
      if (this.activeStemId) {
        const event = new CustomEvent('stem-stopped', {
          detail: {
            stemId: this.activeStemId,
            trackId: this.activeTrackId
          }
        });
        document.dispatchEvent(event);
      }
    }
    
    this.activeAudio = null;
    this.activeStemId = null;
    this.activeTrackId = null;
  }
};

// Cache for storing discovered stem URLs to avoid repeated API calls
const stemUrlCache: Record<string, string> = {};

// Save successful URLs to persistent storage
function saveStemUrlToCache(trackTitle: string, stemName: string, url: string) {
  const cacheKey = `${trackTitle}:${stemName}`;
  stemUrlCache[cacheKey] = url;
  
  try {
    // Try to persist to local storage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      // Store in local storage for persistence between page reloads
      const existingCache = localStorage.getItem('stemUrlCache');
      const cache = existingCache ? JSON.parse(existingCache) : {};
      cache[cacheKey] = url;
      localStorage.setItem('stemUrlCache', JSON.stringify(cache));
    }
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

// Initialize cache from local storage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    // Clear cache first to ensure we don't use old URLs (uncomment to reset cache)
    localStorage.removeItem('stemUrlCache');
    
    const storedCache = localStorage.getItem('stemUrlCache');
    if (storedCache) {
      const parsedCache = JSON.parse(storedCache);
      Object.assign(stemUrlCache, parsedCache);
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
}

// Function to list all files in Strapi uploads for debugging
async function listAllStrapiFiles() {
  try {
    const apiUrl = `${STRAPI_URL}/api/upload/files`;
    
    const response = await fetch(apiUrl);
    if (response.ok) {
      const files = await response.json();
    } else {
      console.error(`[DEBUG] Failed to fetch files: ${response.status}`);
    }
  } catch (error) {
    console.error('[DEBUG] Error listing Strapi files:', error);
  }
}

// Call this function early during app initialization
if (typeof window !== 'undefined') {
  // Run after a short delay to not block the app startup
  setTimeout(() => {
    listAllStrapiFiles();
  }, 1000);
}

// Function to get the correct URL for a stem
async function discoverStemUrl(stemName: string, trackTitle: string): Promise<string> {
  // Create a cache key combining track title and stem name
  const cacheKey = `${trackTitle}:${stemName}`;
  
  // Return cached URL if available
  if (stemUrlCache[cacheKey]) {
    return stemUrlCache[cacheKey];
  }
  
  try {
    // First, try the most reliable method: direct Strapi API query
    try {
      // Create multiple possible stem name variants to search for
      const stemVariants = [
        stemName,                                  // Exact stem name
        stemName.toLowerCase(),                    // Lowercase
        stemName.toUpperCase(),                    // Uppercase
        stemName.replace(/\s+/g, '_'),            // Replace spaces with underscores
        stemName.replace(/\s+/g, '-'),            // Replace spaces with hyphens
      ];
      
      // Create multiple possible track title variants
      const trackVariants = [
        trackTitle,                               // Exact track title
        trackTitle.toLowerCase(),                 // Lowercase
        trackTitle.replace(/\s+/g, '_'),          // Replace spaces with underscores
        trackTitle.split(' ')                     // First word capitalized, rest lowercase
          .map((word, i) => i === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase())
          .join('_'),
        trackTitle.replace(/\s+/g, '-'),          // Replace spaces with hyphens
      ];
      
      // First check: just the stem name without filtering by track
      const stemApiUrl = `${STRAPI_URL}/api/upload/files?filters[name][$contains]=${encodeURIComponent(stemName)}`;
      
      const stemResponse = await fetch(stemApiUrl);
      if (stemResponse.ok) {
        const stemFiles = await stemResponse.json();
        
        // First look for exact matches containing both stem and track name
        const exactMatches = stemFiles.filter((file: any) => {
          const fileName = file.name.toLowerCase();
          const stemNameLower = stemName.toLowerCase();
          const trackTitleLower = trackTitle.toLowerCase();
          
          const exactMatch = fileName.includes(stemNameLower) && 
                            (fileName.includes(trackTitleLower) || 
                             fileName.includes(trackTitleLower.replace(/\s+/g, '_')) ||
                             fileName.includes(trackTitleLower.replace(/\s+/g, '-')));
          
          return exactMatch;
        });
        
        if (exactMatches.length > 0) {
          // Use the first exact match
          const url = exactMatches[0].url.startsWith('/') 
            ? `${STRAPI_URL}${exactMatches[0].url}` 
            : `${STRAPI_URL}/${exactMatches[0].url}`;
            
          stemUrlCache[cacheKey] = url;
          return url;
        }
        
        // If no exact match, try a more lenient match
        // Look through all files
        const filesForStemAndTrack = stemFiles.filter((file: any) => {
          const fileName = file.name.toLowerCase();
          
          // Check if the file name contains the stem name as a whole word
          const hasStemName = stemVariants.some(variant => 
            fileName.includes(variant.toLowerCase())
          );
          
          // Check if the file name contains the track title or a variant
          const hasTrackTitle = trackVariants.some(variant => 
            fileName.includes(variant.toLowerCase())
          );
          
          return hasStemName && hasTrackTitle;
        });
        
        if (filesForStemAndTrack.length > 0) {
          // Sort by relevance - files with both stem and track in the name come first
          filesForStemAndTrack.sort((a: any, b: any) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            
            // Check for underscore pattern which is the most likely format
            const aHasUnderscorePattern = aName.includes(`${stemName.toLowerCase()}_`) || 
                                         aName.includes(`_${stemName.toLowerCase()}`);
            const bHasUnderscorePattern = bName.includes(`${stemName.toLowerCase()}_`) || 
                                         bName.includes(`_${stemName.toLowerCase()}`);
            
            if (aHasUnderscorePattern && !bHasUnderscorePattern) return -1;
            if (!aHasUnderscorePattern && bHasUnderscorePattern) return 1;
            
            // Otherwise sort by length (shorter names preferred)
            return a.name.length - b.name.length;
          });
          
          const bestMatch = filesForStemAndTrack[0];
          const url = bestMatch.url.startsWith('/') 
            ? `${STRAPI_URL}${bestMatch.url}` 
            : `${STRAPI_URL}/${bestMatch.url}`;
          
          stemUrlCache[cacheKey] = url;
          return url;
        }
        
        // If still no matches, try just matching the stem name
        if (stemFiles.length > 0) {
          // Sort by relevance - shorter names first as they're likely cleaner
          stemFiles.sort((a: any, b: any) => a.name.length - b.name.length);
          
          const bestStemMatch = stemFiles[0];
          const url = bestStemMatch.url.startsWith('/') 
            ? `${STRAPI_URL}${bestStemMatch.url}` 
            : `${STRAPI_URL}/${bestStemMatch.url}`;
            
          stemUrlCache[cacheKey] = url;
          return url;
        }
      } else {
        console.log(`[DEBUG] API request failed: ${stemResponse.status}`);
      }
    } catch (apiError) {
      console.warn(`API query error: ${apiError}`);
      // Continue to the next methods if this fails
    }
    
    // Rest of the function remains the same
    console.log(`Looking for stem ${stemName} in Strapi uploads`);
    
    // Try different filename patterns
    const filenamesToTry = [
      // With capitalization matching Strapi
      `${stemName}_${trackTitle.charAt(0).toUpperCase() + trackTitle.slice(1).toLowerCase()}.mp3`,
      `${stemName} - ${trackTitle}.mp3`,
      `${stemName}.mp3`,
      `${stemName.replace(/ /g, '_')}.mp3`,
    ];
    
    // Try each filename pattern
    for (const filename of filenamesToTry) {
      const url = await findFileInStrapiByName(filename);
      if (url) {
        stemUrlCache[cacheKey] = url;
        return url;
      }
    }
    
    throw new Error('No matching files found');
  } catch (error) {
    console.warn(`Could not discover stem URL for ${stemName}, falling back to pattern-based URL`);
    // Fallback to pattern-based URL construction
    return fallbackGetStemUrl(stemName, trackTitle);
  }
}

// Create a mapping of stem names to their hash values that we know work for Elevator Music
const ELEVATOR_MUSIC_STEM_HASHES: Record<string, string> = {
  'Drums': 'dae32bfc61',
  'Bass': 'e5c2194272',
  'Keys': 'dfe75a7bba',
  'Guitars': 'c4832e5827',
  'Synth': '7a9c08fd21',
  'Strings': '3eb47c12a5',
  'FX': '9f1e23d7b4',
  'Brass': '6d2c18a3f9'
};

// Create mappings for other tracks we know about
const CRAZY_MEME_MUSIC_STEM_HASHES: Record<string, string> = {
  'Synth': '75d2d56b7b',
  'Strings': '5f964bf34e',
  'FX': 'b74d971c40',
  'Drums': '5164139b81',
  'Brass': '5d609375bf',
  'Bass': '56c32f2657'
};

// Create mappings for Lo-Fi Beats (replace with actual hash values from console logs)
const LOFI_BEATS_STEM_HASHES: Record<string, string> = {
  'Drums': '177b837b59',
  'Bass': '0f45d36f8d',
  'Keys': 'aa7dbced5a',
  'FX': '1c359d82b1'
};

// Create mappings for Dramatic Epic Cinema (replace with actual hash values from console logs)
const DRAMATIC_EPIC_CINEMA_STEM_HASHES: Record<string, string> = {
  'Drums': '086f64b7b6',
  'Drones': '63518b7d38',
  'Strings': 'dc2c41ee82',
  'FX': '4157ba9835'
};

// Function to get hash for a stem based on the track
function getHash(stemName: string, trackTitle: string): string {
  const trackLower = trackTitle.toLowerCase();
  if (trackLower === 'elevator music') {
    return ELEVATOR_MUSIC_STEM_HASHES[stemName] || '';
  }
  if (trackLower === 'crazy meme music') {
    return CRAZY_MEME_MUSIC_STEM_HASHES[stemName] || '';
  }
  if (trackLower === 'lo-fi beat' || trackLower === 'lo-fi beats') {
    return LOFI_BEATS_STEM_HASHES[stemName] || '';
  }
  if (trackLower === 'dramatic countdown' || trackLower === 'dramatic epic cinema' || trackLower === 'dramatic epic countdown') {
    return DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName] || '';
  }
  // Default to empty string if no hash found
  return '';
}

// Fallback function using patterns when discovery fails
function fallbackGetStemUrl(stemName: string, trackTitle: string): string {
  const trackLower = trackTitle.toLowerCase();
  
  // IMPORTANT: Use the exact URL formats from Strapi
  // For Elevator Music track
  if (trackLower === 'elevator music') {
    const hash = ELEVATOR_MUSIC_STEM_HASHES[stemName];
    if (hash) {
      return `${STRAPI_URL}/uploads/${stemName}_Elevator_music_${hash}.mp3`;
    }
  }
  
  // For Crazy Meme Music
  if (trackLower === 'crazy meme music') {
    const hash = CRAZY_MEME_MUSIC_STEM_HASHES[stemName];
    if (hash) {
      return `${STRAPI_URL}/uploads/${stemName}_Crazy_meme_music_${hash}.mp3`;
    }
  }
  
  // Try to generate using naming patterns we've seen in logs
  // For all other tracks, use the same pattern that works for the known tracks
  // Format track title with first letter uppercase and rest lowercase, spaces replaced with underscores
  const formattedTrackTitle = trackTitle
    .split(' ')
    .map((word, index) => 
      index === 0 
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() 
        : word.toLowerCase()
    )
    .join('_');
  
  // Check if we have any hash for this stem and track
  const hash = getHash(stemName, trackTitle);
  const hashSuffix = hash ? `_${hash}` : '';
  
  // Use the consistent Strapi URL pattern for all tracks
  return `${STRAPI_URL}/uploads/${stemName}_${formattedTrackTitle}${hashSuffix}.mp3`;
}

// Function to get a consistent URL for a stem based on stem name and track title
function getConsistentStemUrl(stemName: string, trackTitle: string): string {
  // Normalize the stem name (capitalize first letter)
  const normalizedStemName = stemName.charAt(0).toUpperCase() + stemName.slice(1);
  
  // Normalize the track title (lowercase with underscores)
  const normalizedTrackTitle = trackTitle.toLowerCase().replace(/\s+/g, '_');
  
  // Construct the base URL pattern - NOTE: Without a hash, this won't work directly
  // We'll use this for API searching later
  return `${normalizedStemName}_${normalizedTrackTitle}`;
}

// Function to search for a stem file through the Strapi API
async function findStemFileUrl(stemName: string, trackTitle: string): Promise<string | null> {
  try {
    // First try to use the utility function from strapi.ts that was made for this purpose
    const strapiStemUrl = await helperFindStemFileUrl(
      'unknown',  // trackId (using a default value since we don't have track.id here)
      trackTitle,  // trackTitle
      stemName     // stemName
    );
    if (strapiStemUrl) {
      return strapiStemUrl;
    }
    
    // If the utility function doesn't find it, fall back to our own implementation
    const basePattern = getConsistentStemUrl(stemName, trackTitle);
    const apiUrl = `${STRAPI_URL}/api/upload/files?filters[name][$contains]=${encodeURIComponent(basePattern)}`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const files = await response.json();
    if (files && files.length > 0) {
      // Sort to find the most relevant match
      const sortedFiles = [...files].sort((a, b) => {
        // Prioritize files that match our pattern exactly (may have different hash)
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Check for exact stem name at start
        const stemPattern = new RegExp(`^${stemName.toLowerCase()}_`, 'i');
        const aHasStemPrefix = stemPattern.test(aName);
        const bHasStemPrefix = stemPattern.test(bName);
        
        if (aHasStemPrefix && !bHasStemPrefix) return -1;
        if (!aHasStemPrefix && bHasStemPrefix) return 1;
        
        // Check for track title
        const trackPattern = trackTitle.toLowerCase().replace(/\s+/g, '_');
        const aHasTrack = aName.includes(trackPattern);
        const bHasTrack = bName.includes(trackPattern);
        
        if (aHasTrack && !bHasTrack) return -1;
        if (!aHasTrack && bHasTrack) return 1;
        
        // Otherwise sort by recency (newer files first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      const bestMatch = sortedFiles[0];
      const url = bestMatch.url.startsWith('/') 
        ? `${STRAPI_URL}${bestMatch.url}` 
        : `${STRAPI_URL}/${bestMatch.url}`;
      
      return url;
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching for stem file: ${error}`);
    return null;
  }
}

// Function to get the correct URL for a stem - returns a string directly for backward compatibility
function getStemUrl(stemName: string, trackTitle: string): string {
  // First check our cache
  const cacheKey = `${trackTitle}:${stemName}`;
  if (stemUrlCache[cacheKey]) {
    return stemUrlCache[cacheKey];
  }
  
  // For existing tracks that use the old hash-based system, maintain compatibility
  const trackLower = trackTitle.toLowerCase();
  if (trackLower === 'elevator music' && ELEVATOR_MUSIC_STEM_HASHES[stemName]) {
    const url = `${STRAPI_URL}/uploads/${stemName}_Elevator_music_${ELEVATOR_MUSIC_STEM_HASHES[stemName]}.mp3`;
    return url;
  }
  if (trackLower === 'crazy meme music' && CRAZY_MEME_MUSIC_STEM_HASHES[stemName]) {
    const url = `${STRAPI_URL}/uploads/${stemName}_Crazy_meme_music_${CRAZY_MEME_MUSIC_STEM_HASHES[stemName]}.mp3`;
    return url;
  }
  if ((trackLower === 'lo-fi beat' || trackLower === 'lo-fi beats') && LOFI_BEATS_STEM_HASHES[stemName]) {
    const url = `${STRAPI_URL}/uploads/${stemName}_Lo_Fi_Beat_${LOFI_BEATS_STEM_HASHES[stemName]}.mp3`;
    return url;
  }
  if ((trackLower === 'dramatic countdown' || trackLower === 'dramatic epic cinema' || trackLower === 'dramatic epic countdown') && DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]) {
    const url = `${STRAPI_URL}/uploads/${stemName}_Dramatic_Countdown_${DRAMATIC_EPIC_CINEMA_STEM_HASHES[stemName]}.mp3`;
    return url;
  }
  
  // Start the API-based discovery process immediately and in the background
  findStemFileUrl(stemName, trackTitle)
    .then(url => {
      if (url) {
        saveStemUrlToCache(trackTitle, stemName, url);
        
        // If we have audio elements already created, update their src
        const audio = document.querySelector(`audio[data-stem="${stemName}"][data-track="${trackTitle}"]`) as HTMLAudioElement;
        if (audio) {
          audio.src = url;
          audio.load();
        }
        return url;
      }
      
      // If API search fails, try our old method
      return null;
    })
    .catch(err => console.error(`Error discovering stem URL: ${err}`));
  
  // For immediate return, we'll use a pattern-based URL as a best guess
  // We'll format it according to what we've seen from Strapi but with a placeholder hash
  // Note: The real URL will be used once discovered via the API

  // Normalize the stem name and track title
  const normalizedStemName = stemName.charAt(0).toUpperCase() + stemName.slice(1);
  const normalizedTrackTitle = trackTitle.split(' ')
    .map((word, index) => word.toLowerCase())
    .join('_');
  
  // Use a placeholder hash that will be replaced when the real one is found
  const placeholderHash = 'placeholder';
  const url = `${STRAPI_URL}/uploads/${normalizedStemName}_${normalizedTrackTitle}_${placeholderHash}.mp3`;
  
  return url;
}

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTagClick: (tag: Tag) => void;
  openStemsTrackId: string | null;
  setOpenStemsTrackId: (id: string | null) => void;
}

// Function to check if a URL exists (returns 200 OK)
async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
  }
}

// Function to find the first valid URL from a list
async function findFirstValidUrl(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    if (await urlExists(url)) {
      return url;
    }
  }
  return null;
}

// Keep track of URL checks in progress
const urlChecksInProgress: Record<string, Promise<string | null>> = {};

// Function to get a valid URL with caching
async function getValidUrl(stemName: string, trackTitle: string): Promise<string | null> {
  const cacheKey = `${trackTitle}:${stemName}`;
  
  // If we have a cached result, use it
  if (stemUrlCache[cacheKey]) {
    return stemUrlCache[cacheKey];
  }
  
  // If this check is already in progress, return its promise
  if (cacheKey in urlChecksInProgress) {
    return urlChecksInProgress[cacheKey];
  }
  
  // For Crazy Meme Music's problematic stems, try specific patterns
  if (trackTitle.toLowerCase() === 'crazy meme music') {
    if (stemName === 'Drums' || stemName === 'Bass') {
      const possibleUrls = [
        `${STRAPI_URL}/uploads/${stemName}_Crazy_meme_music_${CRAZY_MEME_MUSIC_STEM_HASHES[stemName]}.mp3`,
        // Add these specific variants with the corrected hash values
        stemName === 'Drums' ? `${STRAPI_URL}/uploads/Drums_Crazy_meme_music_5164139b81.mp3` : null,
        stemName === 'Bass' ? `${STRAPI_URL}/uploads/Bass_Crazy_meme_music_56c32f2657.mp3` : null,
        `${STRAPI_URL}/uploads/${stemName}_Crazy_meme_music.mp3`,
        `${STRAPI_URL}/uploads/${stemName}.mp3`
      ].filter(Boolean) as string[];
      
      // Start an async check
      const checkPromise = findFirstValidUrl(possibleUrls).then(url => {
        // Remove from in-progress checks
        delete urlChecksInProgress[cacheKey];
        
        if (url) {
          // Cache the result
          saveStemUrlToCache(trackTitle, stemName, url);
          return url;
        }
        return null;
      });
      
      // Store the promise
      urlChecksInProgress[cacheKey] = checkPromise;
      return checkPromise;
    }
  }
  
  // Use our normal discovery function for other stems
  return discoverStemUrl(stemName, trackTitle);
}

export default function AudioPlayer({ 
  track, 
  isPlaying,
  onPlay,
  onStop,
  onTagClick,
  openStemsTrackId,
  setOpenStemsTrackId
}: AudioPlayerProps): React.ReactElement {
  // Add detailed debugging for tags
  // console.log('[AudioPlayer] Component rendering with track:', {
  //   id: track.id,
  //   title: track.title,
  //   tagCount: track.tags?.length || 0
  // });
  
  
  const progressBarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  
  // Add cart context
  const { addItem, removeItem } = useCart();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [stemAddedToCart, setStemAddedToCart] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [playingStems, setPlayingStems] = useState<Record<string, boolean>>({});
  const [stemAudio, setStemAudio] = useState<Record<string, HTMLAudioElement>>({});
  const [stemProgress, setStemProgress] = useState<Record<string, number>>({});
  const [stemLoadErrors, setStemLoadErrors] = useState<Record<string, boolean>>({});
  const [mainAudioLoaded, setMainAudioLoaded] = useState(false);
  const [mainAudioError, setMainAudioError] = useState(false);
  const [stemLoading, setStemLoading] = useState<Record<string, boolean>>({});
  const [progressIntervals, setProgressIntervals] = useState<Record<string, number>>({});
  const [showToast, setShowToast] = useState<{stemId: string, stemName: string, price: number, action: 'add' | 'remove'} | null>(null);
  
  // Track tags state
  const [trackTags, setTrackTags] = useState<Tag[]>(track.tags || []);
  
  // Check if stems are expanded
  const isStemsOpen = openStemsTrackId === track.id;
  
  // Toggle stems panel
  const toggleStems = () => {
    if (isStemsOpen) {
      setOpenStemsTrackId(null);
    } else {
      setOpenStemsTrackId(track.id);
    }
  };
  
  // Fetch tags if none are provided
  useEffect(() => {
    if (track.tags && Array.isArray(track.tags) && track.tags.length > 0) {
      setTrackTags(track.tags);
    } else {
      setTrackTags([]);
    }
  }, [track.id, track.tags]);
  
  // Group tags by type for display
  
  const tagsByType = (trackTags || []).reduce<Record<string, Tag[]>>((acc, tag) => {
    // Get the tag type, defaulting to 'genre' if not specified
    const effectiveType = tag.type || 'genre';
    
    // Initialize array if needed
    if (!acc[effectiveType]) {
      acc[effectiveType] = [];
    }
    
    // Add tag to appropriate category
    acc[effectiveType].push(tag);
    
    return acc;
  }, {});
  
  // Filter out any instrument tags for the fallback display if needed
  const filteredTrackTags = Array.isArray(trackTags) ? trackTags.filter(tag => tag.type !== 'instrument') : [];
  
  // Log the final tag structure
  
  // Add an effect to listen for stem-stopped events from other components
  useEffect(() => {
    const handleStemStopped = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      
      // Check if this event is for a stem in our track
      if (detail && detail.trackId === track.id) {
        // Find the stem by ID
        if (track.stems && detail.stemId) {
          // Update UI to show the stem as stopped
          setPlayingStems(prev => ({
            ...prev,
            [detail.stemId]: false
          }));
          
          // Reset progress
          setStemProgress(prev => ({
            ...prev,
            [detail.stemId]: 0
          }));
          
          // Clear any intervals
          if (progressIntervals[detail.stemId]) {
            window.clearInterval(progressIntervals[detail.stemId]);
            setProgressIntervals(prev => {
              const newIntervals = {...prev};
              delete newIntervals[detail.stemId];
              return newIntervals;
            });
          }
        }
      }
    };
    
    // Add event listener for stem-stopped events
    document.addEventListener('stem-stopped', handleStemStopped);
    
    // Clean up
    return () => {
      document.removeEventListener('stem-stopped', handleStemStopped);
    };
  }, [track.id, track.stems, progressIntervals]);
  
  // Initialize audio element
  useEffect(() => {
    // Log track information for debugging
      console.log(`[AudioPlayer] Initializing track:`, {
        id: track.id,
        title: track.title,
        hasImageUrl: !!track.imageUrl,
        hasAudioUrl: !!track.audioUrl,
        imageUrl: track.imageUrl,
        audioUrl: track.audioUrl,
        hasStems: track.hasStems,
        stemsCount: track.stems?.length || 0
      });

    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      // Use only the Strapi-provided audioUrl
      let audioUrl = track.audioUrl || '';
      if (!audioUrl) {
        console.error(`[AudioPlayer] No audioUrl provided for track:`, track);
        setMainAudioError(true);
        return;
      }
      audio.src = toCdnUrl(audioUrl);
      audio.dataset.track = track.title;
      audio.dataset.trackId = track.id;
      audio.dataset.isMainTrack = 'true';
      
      // Add event listeners with debug logging
      audio.addEventListener('timeupdate', (e) => {
        handleTimeUpdate();
      });
      
      audio.addEventListener('durationchange', (e) => {
      });
      
      audio.addEventListener('playing', (e) => {
      });
      
      audio.addEventListener('ended', handleAudioEnded);
      
      // Add error and canplaythrough handlers with detailed logging
      audio.addEventListener('error', (e) => {
        const error = e.target as HTMLAudioElement;
        console.error(`Error loading main audio: ${audioUrl}`, {
          error: error.error,
          networkState: error.networkState,
          readyState: error.readyState
        });
        setMainAudioError(true);
      });
      
      audio.addEventListener('canplaythrough', () => {
        console.log(`Main audio loaded successfully: ${audioUrl}`);
        setMainAudioLoaded(true);
      });

      audioRef.current = audio;
    } else {
      let audioUrl = track.audioUrl || '';
      if (!audioUrl) {
        console.error(`[AudioPlayer] No audioUrl provided for track:`, track);
        setMainAudioError(true);
        return;
      }
      audioRef.current.src = toCdnUrl(audioUrl);
      audioRef.current.dataset.track = track.title;
      audioRef.current.dataset.trackId = track.id;
      audioRef.current.dataset.isMainTrack = 'true';
      
      // Update data attributes
      audioRef.current.dataset.track = track.title;
      audioRef.current.dataset.trackId = track.id;
      audioRef.current.dataset.isMainTrack = 'true';
    }
    
    // Cleanup function
      return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, [track.audioUrl, track.title, track.id]);
  
  // Handle time updates from audio element
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || track.duration;
      setCurrentTime(current);
      setProgress((current / duration) * 100);
    }
  };
  
  // Handle audio ending
  const handleAudioEnded = () => {
    setCurrentTime(0);
    setProgress(0);
    onStop();
  };
  
  // Update play state when isPlaying changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && !mainAudioError) {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
          setMainAudioError(true);
          onStop();
      });
      } else {
      audioRef.current.pause();
    }
    }
  }, [isPlaying, onStop, mainAudioError]);
  
  // Handle progress bar click
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;
    
    // Don't handle clicks on the thumb (it has its own handlers)
    if (e.target === thumbRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentageClicked = clickX / rect.width;
    
    setIsInteracting(true);
    
    // Set new time based on click position
    updateProgress(percentageClicked);
  };
  
  // Update progress and time based on percentage
  const updateProgress = (percentage: number) => {
    // Clamp percentage between 0 and 1
    const clampedPercentage = Math.max(0, Math.min(percentage, 1));
    
    const newTime = clampedPercentage * (audioRef.current?.duration || track.duration);
    setCurrentTime(newTime);
    setProgress(clampedPercentage * 100);
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    
    // Start playing if needed
    if (!isPlaying) {
      onPlay();
    }
  };
  
  // Handle thumb drag start
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsInteracting(true);
    
    // Add event listeners for drag and drop
    document.addEventListener('mousemove', handleThumbDrag);
    document.addEventListener('mouseup', handleThumbRelease);
  };
  
  // Handle thumb drag
  const handleThumbDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current || !audioRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const posX = e.clientX - rect.left;
    const percentage = posX / rect.width;
    
    updateProgress(percentage);
  }, [isDragging, track.duration, isPlaying, onPlay]);
  
  // Handle thumb release
  const handleThumbRelease = useCallback(() => {
    setIsDragging(false);
    
    // Keep interaction state if we're still playing
    if (!isPlaying) {
      setIsInteracting(false);
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleThumbDrag);
    document.removeEventListener('mouseup', handleThumbRelease);
  }, [handleThumbDrag, isPlaying]);
  
  // Add/remove document event listeners when dragging state changes
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleThumbDrag);
      document.addEventListener('mouseup', handleThumbRelease);
    } else {
      document.removeEventListener('mousemove', handleThumbDrag);
      document.removeEventListener('mouseup', handleThumbRelease);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleThumbDrag);
      document.removeEventListener('mouseup', handleThumbRelease);
    };
  }, [isDragging, handleThumbDrag, handleThumbRelease]);
  
  // Format time for display (mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handlePlayPause = () => {
    if (isPlaying) {
      onStop();
      globalAudioManager.stop();
      setIsInteracting(false);
    } else {
      // Start playing this track, which will automatically stop any other audio
      if (audioRef.current) {
        globalAudioManager.play(audioRef.current, { trackId: track.id });
        onPlay(); // Make sure onPlay is called to update the parent component's state
      } else {
        console.error('[PlayPause] No audio element found in ref');
      }
    }
  };
  
  const handleStemPlayPause = (stemId: string) => {
    const stem = track.stems?.find(s => s.id === stemId);
    if (!stem) {
      return;
    }
        
    console.log('Attempting to play stem:', stem);
    console.log('Stem URL:', stem.url);
    
    const isCurrentStemPlaying = playingStems[stemId];
    
    // If we're turning off the stem, just do that
    if (isCurrentStemPlaying) {
      if (stemAudio[stemId]) {
        stemAudio[stemId].pause();
        globalAudioManager.stop();
      }
      setPlayingStems(prev => ({
        ...prev,
        [stemId]: false
      }));
        return;
      }
      
    // We're turning ON a stem
    
    // 1. Stop the main track of this component if it's playing
      if (isPlaying) {
      audioRef.current?.pause();
        onStop();
      }
      
    // 2. Reset all stem playing states in this track
    const newPlayingStems: Record<string, boolean> = {};
    if (track.stems) {
      track.stems.forEach(s => {
        newPlayingStems[s.id] = s.id === stemId; // Only the current stem is playing
      });
      setPlayingStems(newPlayingStems);
    }
    
    // Handle error case - just set the UI state if there's an error
    if (stemLoadErrors[stemId]) {
      console.log(`Toggling UI for stem with load error: ${stem.name}`);
      
      // Start simulation
      const interval = window.setInterval(() => {
        setStemProgress(prev => {
          const currentProgress = prev[stemId] || 0;
          // Reset to 0 when it reaches 100
          const newProgress = currentProgress >= 100 ? 0 : currentProgress + 0.5;
          return {
            ...prev,
            [stemId]: newProgress
          };
        });
      }, 50);
      
      // Store the interval ID so we can clear it later
      setProgressIntervals(prev => ({
        ...prev,
        [stemId]: interval
      }));
      
      return;
    }
    
    // Normal case - play the actual audio
    const audio = stemAudio[stemId];
    
    if (!audio) {
      console.log(`No audio element for stem: ${stemId}, attempting to create one on-demand`);
      
      // Show more detailed information about the stem and URLs
      console.log(`Stem ${stem.name} details:`, {
        stemId,
        availableAudio: Object.keys(stemAudio),
        availableStems: track.stems?.map(s => s.id)
      });
      
      // Try to create a new audio element using our URL discovery system
      const onDemandUrl = getStemUrl(stem.name, track.title);
      console.log(`Creating on-demand audio element for ${stem.name} with URL: ${onDemandUrl}`);
      
      // Ensure URL is absolute and properly formatted with STRAPI_URL
      let audioUrl = onDemandUrl;
      if (!audioUrl.startsWith('http')) {
        audioUrl = `${STRAPI_URL}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
      }
      
      // Create a new audio element
      const newAudio = new Audio(audioUrl);
      newAudio.dataset.stem = stem.name;
      newAudio.dataset.track = track.title;
      newAudio.dataset.stemId = stemId;
      newAudio.dataset.trackId = track.id;
      
      // Set up error handling
      newAudio.addEventListener('error', (e) => {
        console.error(`Error with on-demand audio for ${stem.name}:`, e);
        // Mark as error but still allow UI interaction
        setStemLoadErrors(prev => ({...prev, [stemId]: true}));
        
        // Update state to show the stem as "playing" even though it's just simulated
        setPlayingStems(prev => ({
          ...prev,
          [stemId]: true
        }));
        
        // Start simulation
        const interval = window.setInterval(() => {
          setStemProgress(prev => {
            const current = prev[stemId] || 0;
            const newProgress = current >= 100 ? 0 : current + 0.5;
            return {...prev, [stemId]: newProgress};
          });
        }, 50);
        
        // Store interval ID
        setProgressIntervals(prev => ({...prev, [stemId]: interval}));
      });
      
      // Add to stemAudio state
      setStemAudio(prev => ({
        ...prev,
        [stemId]: newAudio
      }));
      
      // Start playing it using the global manager
      globalAudioManager.play(newAudio, { stemId, trackId: track.id });
      
      return;
    }
    
    // Audio element exists - play it
    audio.preload = 'auto';
    audio.load();
    
    console.log(`Playing stem ${stem.name} with URL: ${audio.src}`);
    
    // Play through global manager
    globalAudioManager.play(audio, { stemId, trackId: track.id });
    
    // Handle potential errors
    audio.addEventListener('error', error => {
      console.error(`Error playing stem audio (${stem.name}):`, error);
      console.error(`Audio URL: ${audio.src}`);
      console.error(`Audio element state:`, {
        readyState: audio.readyState,
        networkState: audio.networkState,
        paused: audio.paused,
        currentSrc: audio.currentSrc,
        error: audio.error
      });
      
      // Mark this stem as having a load error
      setStemLoadErrors(prev => ({...prev, [stemId]: true}));
      
      // Even if there's an error, update the UI to indicate it's "playing"
      // This helps maintain the illusion of interactivity even with broken audio
      setPlayingStems(prev => ({
        ...prev,
        [stemId]: true
      }));
      
      // Start simulation for better UX
      const interval = window.setInterval(() => {
        setStemProgress(prev => {
          const current = prev[stemId] || 0;
          const newProgress = current >= 100 ? 0 : current + 0.5;
          return {...prev, [stemId]: newProgress};
        });
      }, 50);
      
      // Store interval ID
      setProgressIntervals(prev => ({...prev, [stemId]: interval}));
    });
  };
  
  const handleStemAddToCart = (stem: Stem) => {
    // Show toast notification
    setShowToast({
      stemId: stem.id,
      stemName: stem.name,
      price: stem.price,
      action: 'add'
    });
    
    // Hide toast after 4 seconds
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
    
    setStemAddedToCart(prev => ({ ...prev, [stem.id]: true }));
    
    // Use CartContext instead of onAddToCart prop
    addItem({
      id: stem.id,
      name: stem.name,
      trackName: track.title,
      price: stem.price,
      imageUrl: track.imageUrl,
      type: 'stem'
    });
  };

  const handleStemRemoveFromCart = (stem: Stem) => {
    // Show toast notification for removal
    setShowToast({
      stemId: stem.id,
      stemName: stem.name,
      price: stem.price,
      action: 'remove'
    });
    
    // Hide toast after 4 seconds
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
    
    setStemAddedToCart(prev => ({ ...prev, [stem.id]: false }));
    
    // Use CartContext's removeItem
    removeItem(stem.id);
  };
  
  const handleDownloadAllStems = () => {
    if (!track.stems) return;
    
    track.stems.forEach(stem => {
      if (!stemAddedToCart[stem.id]) {
        setStemAddedToCart(prev => ({ ...prev, [stem.id]: true }));
        
        // Use CartContext's addItem
        addItem({
          id: stem.id,
          name: stem.name,
          trackName: track.title,
          price: stem.price,
          imageUrl: track.imageUrl,
          type: 'stem'
        });
      }
    });
  };

  // Calculate total stems price
  const totalStemsPrice = track.stems?.reduce((sum, stem) => sum + stem.price, 0) || 0;
  const discountedStemsPrice = Math.floor(totalStemsPrice * 0.75 * 100) / 100;

  // Update interaction state when playing state changes
  useEffect(() => {
    if (isPlaying) {
      setIsInteracting(true);
    } else {
      setIsInteracting(false);
    }
  }, [isPlaying]);

  // Modified function to initialize audio elements
  useEffect(() => {
    console.log('Initializing stem audio elements for track:', track.title);
    
    const newStemAudio: Record<string, HTMLAudioElement> = {};
    
    if (track.stems) {
      track.stems.forEach(stem => {
        if (!stemAudio[stem.id]) {
          try {
            // Mark the stem as loading
            setStemLoading(prev => ({...prev, [stem.id]: true}));

            // Prefer direct URLs from Strapi
            const directUrl = stem.mp3Url || stem.wavUrl;
            let audioUrl: string | undefined = undefined;
            if (directUrl) {
              audioUrl = directUrl;
            } else {
              // Fallback to old discovery logic if no direct URL is present
              audioUrl = toCdnUrl(getStemUrl(stem.name, track.title));
              console.warn(`No direct URL for stem ${stem.name}, using fallback: ${audioUrl}`);
            }

            // Create audio element with cross-origin attribute
            const audio = new Audio();
            audio.crossOrigin = "anonymous"; // Add this to prevent CORS issues
            audio.dataset.stem = stem.name;
            audio.dataset.track = track.title;
            audio.dataset.stemId = stem.id;
            audio.dataset.trackId = track.id;

            // Set the source to the direct or fallback URL
            audio.src = audioUrl;

            // Only set up fallback/alternative URLs if no direct URL is present
            let alternativeUrls: (string | (() => Promise<string | null>))[] = [];
            if (!directUrl) {
              alternativeUrls = [
                // First, try to get the actual URL via the API with our improved search function
                async () => {
                  const apiUrl = await findStemFileUrl(stem.name, track.title);
                  if (apiUrl) {
                    return apiUrl; // Already proxied by findStemFileUrl
                  }
                  return null;
                },
                // Try hash-based URLs for known tracks - all properly proxied
                track.title.toLowerCase().includes('elevator music') && ELEVATOR_MUSIC_STEM_HASHES[stem.name]
                  ? convertUrlToProxyUrl(`${STRAPI_URL}/uploads/${stem.name}_Elevator_music_${ELEVATOR_MUSIC_STEM_HASHES[stem.name]}.mp3`)
                  : null,
                track.title.toLowerCase().includes('crazy meme') && CRAZY_MEME_MUSIC_STEM_HASHES[stem.name]
                  ? convertUrlToProxyUrl(`${STRAPI_URL}/uploads/${stem.name}_Crazy_meme_music_${CRAZY_MEME_MUSIC_STEM_HASHES[stem.name]}.mp3`)
                  : null,
                (track.title.toLowerCase().includes('lo-fi beat') || track.title.toLowerCase().includes('lo-fi beats')) && LOFI_BEATS_STEM_HASHES[stem.name]
                  ? convertUrlToProxyUrl(`${STRAPI_URL}/uploads/${stem.name}_Lo_Fi_Beat_${LOFI_BEATS_STEM_HASHES[stem.name]}.mp3`)
                  : null,
                (track.title.toLowerCase().includes('dramatic countdown') || track.title.toLowerCase().includes('dramatic epic')) && DRAMATIC_EPIC_CINEMA_STEM_HASHES[stem.name]
                  ? convertUrlToProxyUrl(`${STRAPI_URL}/uploads/${stem.name}_Dramatic_Countdown_${DRAMATIC_EPIC_CINEMA_STEM_HASHES[stem.name]}.mp3`)
                  : null
              ].filter(Boolean) as (string | (() => Promise<string | null>))[];
            }

            // Use a timeout to avoid hanging on loading forever
            const loadTimeout = setTimeout(() => {
              setStemLoadErrors(prev => ({...prev, [stem.id]: true}));
              setStemLoading(prev => ({...prev, [stem.id]: false}));
            }, 5000);

            // Track which URL attempt we're on
            let currentUrlIndex = 0;
            const maxAttempts = alternativeUrls.length;

            // Function to try loading with next URL
            const tryNextUrl = async () => {
              if (currentUrlIndex < maxAttempts) {
                const nextUrlOrFunc = alternativeUrls[currentUrlIndex++];

                // Handle function-based URLs (like API discovery)
                let nextUrl: string;
                if (typeof nextUrlOrFunc === 'function') {
                  const discoveredUrl = await nextUrlOrFunc();
                  if (discoveredUrl) {
                    nextUrl = discoveredUrl as string;
                  } else {
                    // Move to next option if API returns nothing
                    tryNextUrl();
                    return;
                  }
                } else {
                  nextUrl = nextUrlOrFunc as string;
                }

                // Try the next URL
                audio.src = nextUrl;
                audio.load();
              } else {
                // We've tried all URLs and failed
                clearTimeout(loadTimeout);
                setStemLoadErrors(prev => ({...prev, [stem.id]: true}));
                setStemLoading(prev => ({...prev, [stem.id]: false}));
              }
            };

            // Add error handler with URL retry logic (only if no direct URL)
            if (!directUrl) {
              audio.addEventListener('error', (e) => {
                clearTimeout(loadTimeout); // Ensure timeout is cleared on error
                console.error(`Error loading audio for stem ${stem.name} with URL ${audio.src}:`, e);
                tryNextUrl();
              });
            }

            // Add canplaythrough handler
            audio.addEventListener('canplaythrough', () => {
              clearTimeout(loadTimeout);
              // Store the successful URL in our cache
              saveStemUrlToCache(track.title, stem.name, audio.src);
              setStemLoading(prev => ({...prev, [stem.id]: false}));
              setStemLoadErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[stem.id];
                return newErrors;
              });
            });

            // Set up event handlers for audio playback
            audio.addEventListener('timeupdate', () => {
              const current = audio.currentTime;
              const duration = audio.duration || stem.duration || 30;
              setStemProgress(prev => ({...prev, [stem.id]: (current / duration) * 100}));
            });

            audio.addEventListener('ended', () => {
              // When a stem ends, update our UI and the global audio manager
              setPlayingStems(prev => ({...prev, [stem.id]: false}));
              setStemProgress(prev => ({...prev, [stem.id]: 0}));
              // If this is the currently active audio in the global manager, clear it
              if (globalAudioManager.activeAudio === audio) {
                globalAudioManager.stop();
              }
            });

            // Preload the audio
            audio.load();
            newStemAudio[stem.id] = audio;
          } catch (err) {
            console.error(`Failed to create audio element for ${stem.name}:`, err);
            setStemLoadErrors(prev => ({...prev, [stem.id]: true}));
            setStemLoading(prev => ({...prev, [stem.id]: false}));
          }
        }
      });
    }
    
    // Update the stem audio state
    setStemAudio(prev => ({...prev, ...newStemAudio}));
    
    return () => {
      // Clean up audio elements when component unmounts or track changes
      Object.values(newStemAudio).forEach(audio => {
        // If this is the active audio in the global manager, stop it first
        if (globalAudioManager.activeAudio === audio) {
          globalAudioManager.stop();
        }
        
        audio.pause();
        audio.src = '';
      });
    };
  }, [track.id, track.stems, track.title]);

  // Add special effect to allow "play" simulation for stems even when audio fails
  useEffect(() => {
    // For each stem with errors, set up a simulation effect
    Object.entries(stemLoadErrors).forEach(([stemId, hasError]) => {
      if (hasError && playingStems[stemId]) {
        // If the stem has an error but is set to "playing", simulate progress
        if (!progressIntervals[stemId]) {
          const interval = window.setInterval(() => {
            setStemProgress(prev => {
              const current = prev[stemId] || 0;
              // Loop back to start when reaching 100%
              if (current >= 100) {
                return {...prev, [stemId]: 0};
              }
              // Increment progress slowly
              return {...prev, [stemId]: current + 0.5};
            });
          }, 100);
          
          // Store interval ID
          setProgressIntervals(prev => ({...prev, [stemId]: interval}));
        }
      } else if (progressIntervals[stemId] && (!playingStems[stemId] || !hasError)) {
        // Clear the interval when not playing or not an error
        window.clearInterval(progressIntervals[stemId]);
        setProgressIntervals(prev => {
          const newIntervals = {...prev};
          delete newIntervals[stemId];
          return newIntervals;
        });
        
        // Reset progress if not playing
        if (!playingStems[stemId]) {
          setStemProgress(prev => ({...prev, [stemId]: 0}));
        }
      }
    });
    
    return () => {
      // Clean up all intervals
      Object.values(progressIntervals).forEach(interval => {
        window.clearInterval(interval);
      });
    };
  }, [stemLoadErrors, playingStems]);

  // Clean up intervals when component unmounts
  useEffect(() => {
    return () => {
      // Clean up all intervals
      Object.values(progressIntervals).forEach(interval => {
        window.clearInterval(interval);
      });
    };
  }, [progressIntervals]);

  // Effect to stop playing stems when the stems dropdown is closed or another track's stems are opened
  useEffect(() => {
    // If this track's stems are closed or another track's stems are opened
    if (!isStemsOpen && Object.values(playingStems).some(isPlaying => isPlaying)) {
      // Stop all playing stems
      Object.keys(playingStems).forEach(stemId => {
        if (playingStems[stemId]) {
          // Stop the stem audio
          if (stemAudio[stemId]) {
            stemAudio[stemId].pause();
            stemAudio[stemId].currentTime = 0;
          }
          
          // Update playing state
          setPlayingStems(prev => ({
            ...prev,
            [stemId]: false
          }));
          
          // Reset progress
          setStemProgress(prev => ({
            ...prev,
            [stemId]: 0
          }));
          
          // Clear any intervals
          if (progressIntervals[stemId]) {
            window.clearInterval(progressIntervals[stemId]);
            setProgressIntervals(prev => {
              const newIntervals = {...prev};
              delete newIntervals[stemId];
              return newIntervals;
            });
          }
        }
      });
    }
  }, [isStemsOpen, openStemsTrackId]);
  
  // Stem button rendering
  const renderStemsButton = () => {
    const hasStems = track.hasStems || (track.stems && track.stems.length > 0);
    if (!hasStems) return null;
    return (
      <div className="flex items-center mt-1">
        <button
          className="flex items-center py-1 px-3 text-sm"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '9999px',
            boxShadow: 'none',
            paddingLeft: '10px',
            paddingRight: '10px',
            height: '28px',
            minWidth: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={openStemsPopup}
        >
          <svg
            className="w-4 h-4 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: 'translateY(1px)' }}
          >
            <path d="M2 6c2-2 6-2 8 0s6 2 8 0 6-2 8 0" />
            <path d="M2 12c2-2 6-2 8 0s6 2 8 0 6-2 8 0" />
            <path d="M2 18c2-2 6-2 8 0s6 2 8 0 6-2 8 0" />
          </svg>
          Stems
          <span className="ml-1 text-xs">
            ({track.stems?.length || '...'})
          </span>
        </button>
      </div>
    );
  };

  // Get the most reliable image URL using our utility
  const trackImageUrl = track.imageUrl ? toCdnUrl(track.imageUrl) : '';
  const fallbackImageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l12-2v13'%3E%3C/path%3E%3Ccircle cx='6' cy='18' r='3'%3E%3C/circle%3E%3Ccircle cx='18' cy='16' r='3'%3E%3C/circle%3E%3C/svg%3E";
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  
  // Add this after the other useEffects in the AudioPlayer component
  useEffect(() => {
    const handleStopAllAudio = () => {
      if (isPlaying) {
        onStop();
        globalAudioManager.stop();
        setIsInteracting(false);
      }
    };
    window.addEventListener('stop-all-audio', handleStopAllAudio);
    document.addEventListener('stop-all-audio', handleStopAllAudio);
    return () => {
      window.removeEventListener('stop-all-audio', handleStopAllAudio);
      document.removeEventListener('stop-all-audio', handleStopAllAudio);
    };
  }, [isPlaying, onStop]);
  
  // Stop audio on unmount
  useEffect(() => {
    return () => {
      globalAudioManager.stop();
    };
  }, []);

  // Add state at the top of the component
  const [isStemsPopupOpen, setIsStemsPopupOpen] = useState(false);
  const [selectedTrackForStems, setSelectedTrackForStems] = useState<Track | null>(null);
  // At the top, add state to track the time to start stems playback
  const [stemsStartTime, setStemsStartTime] = useState<number | null>(null);

  // Function to open stems popup for the current track
  const openStemsPopup = () => {
    // Capture the current playback time from the main audio element
    let currentPlaybackTime = 0;
    if (audioRef.current) {
      currentPlaybackTime = audioRef.current.currentTime;
      audioRef.current.pause(); // Stop main player
    }
    setStemsStartTime(currentPlaybackTime);
    setSelectedTrackForStems(track);
    setIsStemsPopupOpen(true);
  };

  return (
    <div 
      className={`relative border-b border-[#1A1A1A] ${isHovering || isInteracting || isStemsOpen ? 'bg-[#232323]' : 'bg-[#121212]'}`}
      style={{ marginBottom: "0" }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Track title, tags, and audio player section - using flex with specific widths */}
      <div className="flex items-center flex-grow w-full px-4 py-[6px]" style={{ minHeight: '84px' }}>
        {/* Track image and info - left side - fixed width */}
        <div className="flex items-center w-[384px] flex-shrink-0">
          {/* Track image with fixed width */}
          <div className="w-14 h-14 rounded overflow-hidden relative mr-4 flex-shrink-0 bg-gray-800 flex items-center justify-center">
            <div 
              className={`absolute inset-0 bg-black ${isHovering || isPlaying ? 'opacity-50' : 'opacity-0'} transition-opacity z-10`}
            />
            {!imageLoadFailed ? (
              <Image
                src={trackImageUrl}
                alt={track.title}
                className="object-cover w-14 h-14"
                width={56}
                height={56}
                crossOrigin="anonymous"
                onError={() => {
                  console.error(`[AudioPlayer] Failed to load image: ${trackImageUrl}`);
                  setImageLoadFailed(true);
                }}
                unoptimized={trackImageUrl.startsWith('http') && !trackImageUrl.includes(process.env.NEXT_PUBLIC_CDN_DOMAIN || 'd1r94114aksajj.cloudfront.net')}
                loading="lazy"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            )}
            
            {/* Play/Pause button overlay */}
            <button 
              className={`absolute inset-0 flex items-center justify-center z-20 transition-opacity ${isHovering || isPlaying ? 'opacity-100' : 'opacity-0'}`}
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="white" 
                >
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
              ) : (
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="white" 
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
          </div>
          
          {/* Title and BPM area */}
          <div className="w-32 mr-6 flex-shrink-0">
            <h3 className="font-bold text-[15px] text-white break-words leading-tight mb-0 line-clamp-2">{track.title}</h3>
            <span className="text-[12.5px] font-normal text-[#999999] block">{track.bpm} BPM</span>
          </div>
          
          {/* Tags area */}
          <div className="w-52 mr-8 flex-shrink-0">
            <div className="text-[12.5px] font-normal text-[#999999] line-clamp-2 relative">
              {Array.isArray(trackTags) && trackTags.length > 0 ? (
                trackTags
                  .filter(tag => tag.type === 'genre' || tag.type === 'mood')
                  .map((tag, index, arr) => (
                    <React.Fragment key={tag.id}>
                      <button 
                        onClick={() => {
                          onTagClick(tag);
                        }}
                        className="hover:text-[#1DF7CE] transition-colors cursor-pointer"
                      >
                        {tag.name}
                      </button>
                      {index < arr.length - 1 && <span>, </span>}
                    </React.Fragment>
                  ))
              ) : null}
            </div>
          </div>
        </div>
        
        {/* Progress bar, duration, and buttons - fixed layout with reliable spacing */}
        <div className="flex items-center justify-between flex-grow pl-24">
          {/* Waveform progress bar - fixed width */}
          <div className="w-[calc(100%-240px)] min-w-[200px]">
            <div className="relative w-full" style={{ cursor: 'pointer' }}>
              <WaveformProgressBar
                audioUrl={track.audioUrl}
                currentTime={currentTime}
                duration={audioRef.current?.duration || track.duration || 0}
                height={44}
                onSeek={(time) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = time;
                    setCurrentTime(time);
                    if (!isPlaying) {
                      onPlay();
                    }
                  }
                }}
              />
            </div>
          </div>
          
          {/* Duration - fixed width with spacer */}
          <div className="w-20 text-[12.5px] font-normal text-[#999999] whitespace-nowrap ml-2 mr-24 flex-shrink-0 text-right">
            {formatTime(currentTime)} / {formatTime(audioRef.current?.duration || track.duration || 0)}
          </div>
          
          {/* Action buttons area */}
          <div className="flex items-center space-x-3 flex-shrink-0 min-w-[110px]">
            {/* Consistent width container for Stems button or placeholder */}
            <div className="w-[68px] flex items-center justify-end h-8">
              {renderStemsButton()}
            </div>
            {/* Hide the Generate Waveform Button as it should only be in the upload page */}
            {/* 
            <button
              className="w-auto h-10 flex items-center justify-center px-4 text-[#1E1E1E] hover:text-[#1DF7CE] transition-colors border-2 border-[#1DF7CE] rounded-full bg-[#1DF7CE] hover:bg-transparent focus:outline-none font-bold z-10"
              style={{ minWidth: 180, marginLeft: 8, display: 'flex' }}
              onClick={async () => {
                // Extract S3 key from audioUrl (remove protocol and domain)
                const audioUrl = track.audioUrl || '';
                const s3Key = audioUrl.replace(/^https?:\/\/[^/]+\//, '');
                const res = await fetch('/api/generate-waveform', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ s3Key }),
                });
                const data = await res.json();
                if (data.success) {
                  alert('Waveform generated!');
                } else {
                  alert('Error: ' + data.error);
                  console.error('Waveform generation error:', data.error);
                }
              }}
              title="Generate waveform JSON for this track"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14m7-7H5" />
              </svg>
              Generate Waveform
            </button>
            */}
            <button 
              className="w-8 h-8 flex items-center justify-center text-[#1E1E1E] hover:text-[#1DF7CE] transition-colors border-2 border-[#1DF7CE] rounded-full bg-[#1DF7CE] hover:bg-transparent focus:outline-none"
              onClick={async () => {
                try {
                  // Fetch the file as a blob
                  const audioUrl = track.audioUrl ? toCdnUrl(track.audioUrl) : '';
                  if (!audioUrl) {
                    console.error('[AudioPlayer] No audio URL available for download');
                    return;
                  }
                  
                  const response = await fetch(audioUrl);
                  const blob = await response.blob();
                  
                  // Create a temporary anchor element
                  const a = document.createElement('a');
                  a.href = window.URL.createObjectURL(blob);
                  
                  // Set the download attribute with the track title as filename
                  const filename = `${track.title}.mp3`;
                  a.download = filename;
                  
                  // Append to body, click, and remove
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  
                  // Clean up the URL object
                  window.URL.revokeObjectURL(a.href);
                } catch (error) {
                  console.error('Error downloading track:', error);
                }
              }}
              title="Download track"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="4" x2="12" y2="16" />
                <polyline points="8 12 12 16 16 12" />
                <line x1="6" y1="20" x2="18" y2="20" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Stems dropdown - modify this if needed */}
      {isStemsOpen && track.stems && (
        <div className="bg-[#232323] rounded-b p-4 pt-2">
          <div className="flex justify-end items-center mb-3">
            {/* Remove this button that has the extra chevron */}
            {/* <button 
              onClick={() => setOpenStemsTrackId(null)}
              className="text-white hover:text-[#1DF7CE]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button> */}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {track.stems.map(stem => (
              <div 
                key={stem.id} 
                className="rounded p-3 flex items-center hover:bg-[#2A2A2A] transition-colors"
              >
                <div className="w-14 mr-2">
                  <p className="font-bold text-xs text-white break-words leading-tight">{stem.name}</p>
                </div>
                
                <button 
                  onClick={() => handleStemPlayPause(stem.id)}
                  className={`w-8 h-8 flex items-center justify-center ${
                    stemLoadErrors[stem.id] ? 'text-amber-500' : 
                    stemLoading[stem.id] ? 'text-gray-400' : 'text-white'
                  } hover:text-[#1DF7CE] mr-2`}
                  disabled={false}
                  title={
                    stemLoadErrors[stem.id] ? "Audio unavailable - Click to simulate playback" : 
                    stemLoading[stem.id] ? "Loading stem audio..." : 
                    playingStems[stem.id] ? "Pause stem" : "Play stem"
                  }
                >
                  {stemLoadErrors[stem.id] ? (
                    playingStems[stem.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                        <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                        <circle cx="20" cy="4" r="2" fill="currentColor" />
            </svg>
          ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
                        <circle cx="19" cy="5" r="2" fill="currentColor" />
                      </svg>
                    )
                  ) : stemLoading[stem.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"></circle>
                      <path d="M12 2C6.5 2 2 6.5 2 12"></path>
                    </svg>
                  ) : playingStems[stem.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                      <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
            </svg>
          )}
        </button>
        
                {/* Progress bar for stems */}
                <div 
                  className="flex-grow h-4 relative mx-1 flex items-center"
                  style={{ maxWidth: "calc(62% - 50px)" }}
                  onClick={(e) => {
                    if (stemLoadErrors[stem.id]) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percentage = clickX / rect.width;
                    const newTime = percentage * stem.duration;
                    
                    if (stemAudio[stem.id]) {
                      stemAudio[stem.id].currentTime = newTime;
                      setStemProgress(prev => ({...prev, [stem.id]: percentage * 100}));
                      
                      if (!playingStems[stem.id]) {
                        // Start playing if not already
                        handleStemPlayPause(stem.id);
                      }
                    }
                  }}
                >
                  {/* Gray track background */}
                  <div className="w-full h-[8px] bg-[#3A3A3A] rounded-full cursor-pointer" />
                  
                  {stemLoadErrors[stem.id] ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400">
                        {playingStems[stem.id] ? 'Simulating playback' : 'Audio unavailable'}
                      </div>
                      {playingStems[stem.id] && (
                        <div 
                          className="absolute top-1/2 h-[8px] rounded-full bg-amber-500/30 transform -translate-y-1/2"
                          style={{ width: `${stemProgress[stem.id] || 0}%`, left: 0 }}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {/* Teal progress fill */}
                      <div 
                        className={`absolute top-1/2 h-[8px] rounded-full ${playingStems[stem.id] ? 'bg-[#1DF7CE]' : 'bg-[#555555]'} transform -translate-y-1/2`}
                        style={{ width: `${stemProgress[stem.id] || 0}%`, left: 0, zIndex: 2 }}
                      />
                      
                      {/* Teal dot at the edge of progress */}
                      <div 
                        className={`absolute w-3.5 h-3.5 rounded-full ${playingStems[stem.id] ? 'bg-[#1DF7CE]' : 'bg-[#555555]'} cursor-pointer`}
                        style={{ 
                          left: `${stemProgress[stem.id] || 0}%`, 
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 3
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          // Get the parent progress bar element reference
                          const progressBarEl = e.currentTarget.closest('.flex-grow');
                          if (!progressBarEl) return;
                          
                          // Create a function for handling the drag
                          const handleDrag = (moveEvent: MouseEvent) => {
                            const rect = progressBarEl.getBoundingClientRect();
                            if (!rect) return;
                            
                            const posX = moveEvent.clientX - rect.left;
                            const percentage = Math.max(0, Math.min(1, posX / rect.width));
                            const newTime = percentage * stem.duration;
                            
                            if (stemAudio[stem.id]) {
                              stemAudio[stem.id].currentTime = newTime;
                              setStemProgress(prev => ({...prev, [stem.id]: percentage * 100}));
                              
                              if (!playingStems[stem.id]) {
                                // Start playing if not already
                                handleStemPlayPause(stem.id);
                              }
                            }
                          };
                          
                          // Function to remove event listeners when done
                          const handleDragEnd = () => {
                            document.removeEventListener('mousemove', handleDrag);
                            document.removeEventListener('mouseup', handleDragEnd);
                          };
                          
                          // Add event listeners for drag and release
                          document.addEventListener('mousemove', handleDrag);
                          document.addEventListener('mouseup', handleDragEnd);
                        }}
                      />
                    </>
                  )}
                </div>
                
                <div className="w-20 text-white text-xs font-normal text-center mx-1">
                  {formatTime(stemProgress[stem.id] ? (stem.duration * stemProgress[stem.id] / 100) : 0)} / {formatTime(stem.duration)}
                </div>
                
                <div className="flex flex-col items-center ml-1">
                  {/* New add/remove button design with Material Design cart icons */}
                  {stemAddedToCart[stem.id] ? (
        <button 
                      onClick={() => handleStemRemoveFromCart(stem)}
                      className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                      title="Remove from cart"
                    >
                      {/* Material Design remove shopping cart icon */}
                      <span className="material-symbols-outlined text-[20px]">
                        remove_shopping_cart
                      </span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStemAddToCart(stem)}
                      className="w-8 h-8 flex items-center justify-center text-[#1DF7CE] hover:text-[#19b8a3] transition-colors"
                      title="Add to cart"
                    >
                      {/* Material Design add shopping cart icon */}
                      <span className="material-symbols-outlined text-[20px]">
                        add_shopping_cart
                      </span>
        </button>
                  )}
                  <span className="mt-1 text-xs text-[#999999]">€{stem.price}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Buy all stems button */}
          <div style={{ marginRight: '88px' }} className="flex justify-end items-center mt-4">
            <button
              onClick={handleDownloadAllStems}
              className="bg-[#1DF7CE] hover:bg-[#19d9b6] text-[#1E1E1E] px-4 py-2 rounded-full font-medium transition-colors"
            >
              <span className="font-medium">Buy All Stems</span>
              <span className="text-xs mx-2 text-black/50 line-through">€{totalStemsPrice}</span>
              <span className="text-sm">€{discountedStemsPrice}</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Toast notification for stem added/removed from cart */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#232323] border border-[#1DF7CE] text-white px-4 py-3 rounded shadow-lg flex items-center animate-slide-up">
          {showToast.action === 'add' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1DF7CE] mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5l10 -10"></path>
          </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              <line x1="15" y1="8" x2="9" y2="14" />
              <line x1="9" y1="8" x2="15" y2="14" />
            </svg>
          )}
          <span>
            <strong>{showToast.stemName}</strong> 
            {showToast.action === 'add' ? ' added to cart • ' : ' removed from cart • '}
            €{showToast.price}
          </span>
          <button 
            onClick={() => setShowToast(null)}
            className="ml-4 text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
      </div>
      )}
      {/* Only render StemsPopup if selectedTrackForStems is not null */}
      {isStemsPopupOpen && selectedTrackForStems && (
        <StemsPopup
          isOpen={isStemsPopupOpen}
          onClose={() => {
            setIsStemsPopupOpen(false);
            setSelectedTrackForStems(null);
          }}
          track={selectedTrackForStems}
          startTime={stemsStartTime}
        />
      )}
    </div>
  );
} 

// Add animation for the toast notification
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('toast-animation');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'toast-animation';
    style.textContent = `
      @keyframes slide-up {
        from { transform: translate(-50%, 100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      .animate-slide-up {
        animation: slide-up 0.3s ease forwards;
      }
    `;
    document.head.appendChild(style);
  }
}
