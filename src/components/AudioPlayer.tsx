'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Tag, Stem, Track, CartItem } from '../types';
import { findFileInStrapiByName } from '../services/strapi';

// Import STRAPI_URL from the strapi service
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_MEDIA_URL || 'http://localhost:1337';

// Global audio manager to ensure only one audio source plays at a time
const globalAudioManager = {
  activeAudio: null as HTMLAudioElement | null,
  activeStemId: null as string | null,
  activeTrackId: null as string | null,
  
  // Play an audio element and stop any currently playing audio
  play(audio: HTMLAudioElement, info?: { stemId?: string, trackId?: string }) {
    // Stop any currently playing audio
    if (this.activeAudio && this.activeAudio !== audio && !this.activeAudio.paused) {
      console.log('Stopping previously playing audio');
      this.activeAudio.pause();
      
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
      console.log(`Cached URL for ${stemName} (${trackTitle}) to localStorage`);
    }
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

// Initialize cache from local storage
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const storedCache = localStorage.getItem('stemUrlCache');
    if (storedCache) {
      const parsedCache = JSON.parse(storedCache);
      Object.assign(stemUrlCache, parsedCache);
      console.log('Loaded stem URL cache from localStorage:', Object.keys(parsedCache).length, 'entries');
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
}

// Function to list all files in Strapi uploads for debugging
async function listAllStrapiFiles() {
  try {
    const apiUrl = `${STRAPI_URL}/api/upload/files`;
    console.log(`[DEBUG] Fetching all files from Strapi: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (response.ok) {
      const files = await response.json();
      console.log(`[DEBUG] Found ${files.length} files in Strapi uploads:`);
      
      // Group files by track patterns to help identify all available tracks and their stems
      const trackPatterns: Record<string, any[]> = {};
      const stemFiles: Record<string, any[]> = {};
      
      // Common stem names to look for
      const stemNames = ['Drums', 'Bass', 'Keys', 'Guitars', 'Synth', 'Strings', 'FX', 'Brass'];
      
      files.forEach((file: any) => {
        const fileName = file.name.toLowerCase();
        const url = `${STRAPI_URL}${file.url}`;
        
        // Log each file with its URL
        console.log(`[DEBUG] File: ${file.name} -> ${url}`);
        
        // Try to identify which track it belongs to
        let trackName = null;
        
        // Extract track name from common patterns
        stemNames.forEach(stemName => {
          const stemPattern = new RegExp(`${stemName.toLowerCase()}_(.+?)(?:_[a-z0-9]+)?\.mp3`, 'i');
          const match = fileName.match(stemPattern);
          if (match) {
            trackName = match[1].replace(/_/g, ' ');
            
            // Capitalize track name for display
            trackName = trackName.split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
              
            // Add to stem files for this track
            if (!stemFiles[trackName]) {
              stemFiles[trackName] = [];
            }
            
            stemFiles[trackName].push({
              fileName: file.name,
              url,
              stemName,
              hash: fileName.match(/_([a-z0-9]+)\.mp3$/)?.[1] || null
            });
          }
        });
        
        // If we've identified a track, add it to track patterns
        if (trackName && !trackPatterns[trackName]) {
          trackPatterns[trackName] = [];
        }
        
        if (trackName) {
          trackPatterns[trackName].push({
            fileName: file.name,
            url
          });
        }
      });
      
      // Log organized files by track
      console.log('[DEBUG] Files by track:');
      Object.entries(stemFiles).forEach(([track, files]) => {
        console.log(`[DEBUG] Track "${track}": ${files.length} stem files`);
        
        // Create a hash map for this track's stems
        const hashMap: Record<string, string> = {};
        
        files.forEach(file => {
          console.log(`[DEBUG]   - ${file.stemName}: ${file.fileName} -> ${file.url}`);
          
          // If this file has a hash, add it to the hash map
          if (file.hash) {
            hashMap[file.stemName] = file.hash;
          }
        });
        
        // Log the hash map in a format that can be directly copied into code
        if (Object.keys(hashMap).length > 0) {
          console.log('[DEBUG] Hash map for this track:');
          console.log('const ' + track.toUpperCase().replace(/\s+/g, '_') + '_STEM_HASHES: Record<string, string> = {');
          Object.entries(hashMap).forEach(([stem, hash]) => {
            console.log(`  '${stem}': '${hash}',`);
          });
          console.log('};');
        }
      });
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
      
      console.log(`[DEBUG] Looking for stem "${stemName}" for track "${trackTitle}"`);
      console.log(`[DEBUG] Trying ${stemVariants.length} stem variants and ${trackVariants.length} track variants`);
      
      // First check: just the stem name without filtering by track
      const stemApiUrl = `${STRAPI_URL}/api/upload/files?filters[name][$contains]=${encodeURIComponent(stemName)}`;
      console.log(`[DEBUG] Querying files containing stem name: ${stemApiUrl}`);
      
      const stemResponse = await fetch(stemApiUrl);
      if (stemResponse.ok) {
        const stemFiles = await stemResponse.json();
        console.log(`[DEBUG] Found ${stemFiles.length} files containing "${stemName}"`);
        
        // First look for exact matches containing both stem and track name
        const exactMatches = stemFiles.filter((file: any) => {
          const fileName = file.name.toLowerCase();
          const stemNameLower = stemName.toLowerCase();
          const trackTitleLower = trackTitle.toLowerCase();
          
          const exactMatch = fileName.includes(stemNameLower) && 
                            (fileName.includes(trackTitleLower) || 
                             fileName.includes(trackTitleLower.replace(/\s+/g, '_')) ||
                             fileName.includes(trackTitleLower.replace(/\s+/g, '-')));
                             
          if (exactMatch) {
            console.log(`[DEBUG] EXACT MATCH: ${file.name} -> ${STRAPI_URL}${file.url}`);
          }
          
          return exactMatch;
        });
        
        if (exactMatches.length > 0) {
          // Use the first exact match
          const url = exactMatches[0].url.startsWith('/') 
            ? `${STRAPI_URL}${exactMatches[0].url}` 
            : `${STRAPI_URL}/${exactMatches[0].url}`;
            
          console.log(`✅ Found exact match via API for ${stemName}: ${url}`);
          stemUrlCache[cacheKey] = url;
          return url;
        }
        
        // If no exact match, try a more lenient match
        console.log(`[DEBUG] No exact matches, trying more lenient matching...`);
        
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
          
          if (hasStemName && hasTrackTitle) {
            console.log(`[DEBUG] POTENTIAL MATCH: ${file.name} -> ${STRAPI_URL}${file.url}`);
          }
          
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
          
          console.log(`✅ Found best match for ${stemName}: ${bestMatch.name} -> ${url}`);
          stemUrlCache[cacheKey] = url;
          return url;
        }
        
        // If still no matches, try just matching the stem name
        console.log(`[DEBUG] No stem + track matches, trying just stem matches...`);
        
        if (stemFiles.length > 0) {
          // Sort by relevance - shorter names first as they're likely cleaner
          stemFiles.sort((a: any, b: any) => a.name.length - b.name.length);
          
          const bestStemMatch = stemFiles[0];
          const url = bestStemMatch.url.startsWith('/') 
            ? `${STRAPI_URL}${bestStemMatch.url}` 
            : `${STRAPI_URL}/${bestStemMatch.url}`;
            
          console.log(`✅ Found stem-only match for ${stemName}: ${bestStemMatch.name} -> ${url}`);
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
        console.log(`✅ Found stem URL for ${stemName}: ${url}`);
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
    const basePattern = getConsistentStemUrl(stemName, trackTitle);
    const apiUrl = `${STRAPI_URL}/api/upload/files?filters[name][$contains]=${encodeURIComponent(basePattern)}`;
    
    console.log(`Searching for stem file with pattern: ${basePattern} via API: ${apiUrl}`);
    
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
      
      console.log(`✅ Found stem file: ${bestMatch.name} -> ${url}`);
      return url;
    }
    
    console.log(`No files found matching pattern: ${basePattern}`);
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
    console.log(`Using existing URL for stem ${stemName}: ${stemUrlCache[cacheKey]}`);
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
        console.log(`Successfully discovered URL via API for ${stemName} (${trackTitle}): ${url}`);
        saveStemUrlToCache(trackTitle, stemName, url);
        
        // If we have audio elements already created, update their src
        const audio = document.querySelector(`audio[data-stem="${stemName}"][data-track="${trackTitle}"]`) as HTMLAudioElement;
        if (audio) {
          console.log(`Updating existing audio element for ${stemName} with discovered URL: ${url}`);
          audio.src = url;
          audio.load();
        }
        return url;
      }
      
      // If API search fails, try our old method
      console.log(`API search failed for ${stemName} (${trackTitle}), falling back to pattern-based URLs`);
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
  
  console.log(`Using pattern-based URL for ${stemName} (${trackTitle}): ${url}`);
  return url;
}

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onAddToCart: (stem: Stem, track: Track) => void;
  onTagClick: (tag: Tag) => void;
  onRemoveFromCart: (itemId: string) => void;
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
    console.log(`Checking if URL exists: ${url}`);
    if (await urlExists(url)) {
      console.log(`✅ Found valid URL: ${url}`);
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
  onAddToCart,
  onTagClick,
  onRemoveFromCart
}: AudioPlayerProps): React.ReactElement {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isStemsOpen, setIsStemsOpen] = useState(false);
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
  
  // Group tags by type for display, filtering out Instrument tags
  const tagsByType = track.tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    // Only include Genre and Mood tags (case insensitive comparison)
    const tagTypeLower = tag.type.toLowerCase();
    if (tagTypeLower === 'genre' || tagTypeLower === 'mood') {
      const type = tag.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(tag);
    }
    return acc;
  }, {});
  
  // Add an effect to listen for stem-stopped events from other components
  useEffect(() => {
    const handleStemStopped = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      
      // Check if this event is for a stem in our track
      if (detail && detail.trackId === track.id) {
        console.log('Received stem-stopped event for current track:', detail);
        
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
    if (!audioRef.current) {
      audioRef.current = new Audio(track.audioUrl);
      
      // Add data attributes for identification
      if (audioRef.current) {
        audioRef.current.dataset.track = track.title;
        audioRef.current.dataset.trackId = track.id;
        audioRef.current.dataset.isMainTrack = 'true';
      }
      
      // Add event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleAudioEnded);
      
      // Add error and canplaythrough handlers
      audioRef.current.addEventListener('error', () => {
        console.error(`Error loading main audio: ${track.audioUrl}`);
        setMainAudioError(true);
      });
      
      audioRef.current.addEventListener('canplaythrough', () => {
        console.log('Main audio loaded successfully');
        setMainAudioLoaded(true);
      });
    } else {
      audioRef.current.src = track.audioUrl;
      
      // Update data attributes
      audioRef.current.dataset.track = track.title;
      audioRef.current.dataset.trackId = track.id;
      audioRef.current.dataset.isMainTrack = 'true';
    }
    
      return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        
        // If this audio element is the active one in the global manager, remove it
        if (globalAudioManager.activeAudio === audioRef.current) {
          globalAudioManager.stop();
        }
        
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [track.id, track.audioUrl, track.title]);
  
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
      }
      
      // Reset playing state for all stems in this track
      if (track.stems) {
        const newPlayingStems: Record<string, boolean> = {};
        track.stems.forEach(stem => {
          newPlayingStems[stem.id] = false;
        });
        setPlayingStems(newPlayingStems);
      }
      
      onPlay();
      setIsInteracting(true);
    }
  };
  
  const handleStemPlayPause = (stemId: string) => {
    const stem = track.stems?.find(s => s.id === stemId);
    if (!stem) {
      console.error('Stem not found:', stemId);
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
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
    
    setStemAddedToCart(prev => ({ ...prev, [stem.id]: true }));
    onAddToCart(stem, track);
  };

  const handleStemRemoveFromCart = (stem: Stem) => {
    // Show toast notification for removal
    setShowToast({
      stemId: stem.id,
      stemName: stem.name,
      price: stem.price,
      action: 'remove'
    });
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
    
    setStemAddedToCart(prev => ({ ...prev, [stem.id]: false }));
    if (onRemoveFromCart) {
      // Create a cart item ID using track and stem IDs
      const itemId = `${track.id}_${stem.id}`;
      onRemoveFromCart(itemId);
    }
  };
  
  const handleDownloadAllStems = () => {
    if (!track.stems) return;
    
    track.stems.forEach(stem => {
      if (!stemAddedToCart[stem.id]) {
        setStemAddedToCart(prev => ({ ...prev, [stem.id]: true }));
        onAddToCart(stem, track);
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
      console.log('Number of stems:', track.stems.length);
      
      track.stems.forEach(stem => {
        if (!stemAudio[stem.id]) {
          try {
            // Mark the stem as loading
            setStemLoading(prev => ({...prev, [stem.id]: true}));
            
            // Get URL using our discovery function
            let initialUrl;
            
            // Legacy support for known tracks
            if ((track.title.toLowerCase() === 'elevator music' || 
                track.title.toLowerCase() === 'crazy meme music' ||
                track.title.toLowerCase() === 'lo-fi beat' || 
                track.title.toLowerCase() === 'lo-fi beats' || 
                track.title.toLowerCase() === 'dramatic countdown' || 
                track.title.toLowerCase() === 'dramatic epic cinema' || 
                track.title.toLowerCase() === 'dramatic epic countdown') && 
                (stem.name === 'Drums' || stem.name === 'Bass' || stem.name === 'Keys' || 
                 stem.name === 'FX' || stem.name === 'Drones' || stem.name === 'Strings')) {
              initialUrl = getStemUrl(stem.name, track.title);
            } else {
              // For all new tracks, try to discover immediately
              initialUrl = getStemUrl(stem.name, track.title);
              
              // Kick off immediate API discovery - this will update the audio.src later if found
              findStemFileUrl(stem.name, track.title).then(url => {
                console.log(`Initial API discovery for ${stem.name}: ${url || 'not found'}`);
              });
            }
            
            console.log(`Initial URL for stem ${stem.name}: ${initialUrl}`);
            
            // Ensure URL is absolute
            let audioUrl = initialUrl;
            if (!audioUrl.startsWith('http')) {
              audioUrl = `${STRAPI_URL}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
            }
            
            // Create audio element with data attributes for identification
            const audio = new Audio(audioUrl);
            audio.dataset.stem = stem.name;
            audio.dataset.track = track.title;
            audio.dataset.stemId = stem.id;
            audio.dataset.trackId = track.id;
            
            // Create an array of alternative URLs to try if the first one fails
            // We'll try various hash patterns and formats to ensure we find the file
            const alternativeUrls = [
              // First, try to get the actual URL via the API
              async () => {
                const apiUrl = await findStemFileUrl(stem.name, track.title);
                if (apiUrl) return apiUrl;
                return null;
              },
              
              // Try variations of the pattern with and without hash
              `${STRAPI_URL}/uploads/${stem.name}_${track.title.toLowerCase().replace(/\s+/g, '_')}.mp3`,
              
              // Try legacy patterns for compatibility
              track.title.toLowerCase() === 'elevator music' && ELEVATOR_MUSIC_STEM_HASHES[stem.name]
                ? `${STRAPI_URL}/uploads/${stem.name}_Elevator_music_${ELEVATOR_MUSIC_STEM_HASHES[stem.name]}.mp3`
                : null,
              track.title.toLowerCase() === 'crazy meme music' && CRAZY_MEME_MUSIC_STEM_HASHES[stem.name]
                ? `${STRAPI_URL}/uploads/${stem.name}_Crazy_meme_music_${CRAZY_MEME_MUSIC_STEM_HASHES[stem.name]}.mp3`
                : null,
              (track.title.toLowerCase() === 'lo-fi beat' || track.title.toLowerCase() === 'lo-fi beats') && LOFI_BEATS_STEM_HASHES[stem.name]
                ? `${STRAPI_URL}/uploads/${stem.name}_Lo_Fi_Beat_${LOFI_BEATS_STEM_HASHES[stem.name]}.mp3`
                : null,
              (track.title.toLowerCase() === 'dramatic countdown' || track.title.toLowerCase() === 'dramatic epic cinema' || track.title.toLowerCase() === 'dramatic epic countdown') && DRAMATIC_EPIC_CINEMA_STEM_HASHES[stem.name]
                ? `${STRAPI_URL}/uploads/${stem.name}_Dramatic_Countdown_${DRAMATIC_EPIC_CINEMA_STEM_HASHES[stem.name]}.mp3`
                : null,
              
              // Fallback to stem name only
              `${STRAPI_URL}/uploads/${stem.name}.mp3`,
            ].filter(Boolean);
            
            // Use a timeout to avoid hanging on loading forever
            const loadTimeout = setTimeout(() => {
              console.warn(`Timeout loading audio for ${stem.name}`);
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
                  console.log(`Trying to discover URL via API for ${stem.name}...`);
                  const discoveredUrl = await nextUrlOrFunc();
                  if (discoveredUrl) {
                    nextUrl = discoveredUrl as string;
                  } else {
                    console.log(`API discovery returned no URL, trying next alternative...`);
                    // Move to next option if API returns nothing
                    tryNextUrl();
                    return;
                  }
                } else {
                  nextUrl = nextUrlOrFunc as string;
                }
                
                console.log(`Trying alternative URL for ${stem.name}: ${nextUrl}`);
                
                // Try the next URL
                audio.src = nextUrl;
                audio.load();
              } else {
                // We've tried all URLs and failed
                clearTimeout(loadTimeout);
                console.error(`All URL attempts failed for stem ${stem.name}`);
                setStemLoadErrors(prev => ({...prev, [stem.id]: true}));
                setStemLoading(prev => ({...prev, [stem.id]: false}));
              }
            };
            
            // Add error handler with URL retry logic
            audio.addEventListener('error', (e) => {
              console.error(`Error loading audio for stem ${stem.name} with URL ${audio.src}:`, e);
              console.log(`%c❌ FAILED URL: ${audio.src}`, 'background: red; color: white; font-size: 16px');
              
              // Try the next URL in our list
              tryNextUrl();
            });
            
            // Add canplaythrough handler
            audio.addEventListener('canplaythrough', () => {
              clearTimeout(loadTimeout);
              console.log(`Audio loaded successfully for stem: ${stem.name} with URL ${audio.src}`);
              
              // Store the successful URL in our cache and log it prominently
              saveStemUrlToCache(track.title, stem.name, audio.src);
              console.log(`%c✅ SUCCESSFUL URL: ${audio.src}`, 'background: green; color: white; font-size: 16px');
              
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
          console.log(`Setting up progress simulation for stem ${stemId}`);
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

  return (
    <div 
      className={`relative border-b border-[#1A1A1A] ${isHovering || isInteracting || isStemsOpen ? 'bg-[#232323]' : 'bg-[#121212]'}`}
      style={{ marginBottom: "0" }} /* Change from -1px to 0 to remove gap */
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div 
        className="flex items-center px-4 py-[6px] rounded"
        style={{ minHeight: '84px' }} // Increased from 80px to 84px
      >
        {/* Track image with fixed width - increased size */}
        <div className="w-14 h-14 rounded overflow-hidden relative mr-4 flex-shrink-0">
          <div 
            className={`absolute inset-0 bg-black ${isHovering || isPlaying ? 'opacity-50' : 'opacity-0'} transition-opacity z-10`}
          />
          <Image 
            src={track.imageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l12-2v13'%3E%3C/path%3E%3Ccircle cx='6' cy='18' r='3'%3E%3C/circle%3E%3Ccircle cx='18' cy='16' r='3'%3E%3C/circle%3E%3C/svg%3E"} 
            alt={track.title}
            width={56}
            height={56}
            className="object-cover w-14 h-14"
          />
          <button 
            onClick={mainAudioError ? undefined : handlePlayPause}
            disabled={mainAudioError}
            className={`absolute inset-0 flex items-center justify-center z-20 ${
              isHovering || isPlaying ? 'opacity-100' : 'opacity-0'
            } transition-opacity ${mainAudioError ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            title={mainAudioError ? "Audio file could not be loaded" : "Play/Pause"}
          >
            {mainAudioError ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" />
              </svg>
            ) : isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
        
        {/* Title and BPM area - centered vertically and aligned as a group */}
        <div className="w-32 mr-6 flex-shrink-0 flex flex-col justify-center">
          <h3 className="font-bold text-[15px] text-white break-words leading-tight">{track.title}</h3>
          <div className="mt-0"> {/* Reduced from mt-0.5 to mt-0 to make space smaller */}
            <span className="text-[12.5px] font-normal text-[#999999]">{track.bpm} BPM</span>
          </div>
        </div>
        
        {/* Tags area - fixed width, filtered to only show Genre and Mood tags */}
        <div className="w-52 mr-2 flex-shrink-0">
          <div className="text-[12.5px] font-normal text-[#999999] overflow-hidden line-clamp-2">
            {Object.entries(tagsByType).flatMap(([type, tags], typeIndex, array) => (
              tags.map((tag, tagIndex, tagArray) => (
                <React.Fragment key={tag.id}>
                  <button 
                    onClick={() => {
                      console.log('[AudioPlayer] Tag clicked:', tag);
                      console.log('[AudioPlayer] Tag object structure:', JSON.stringify(tag));
                      onTagClick(tag);
                    }}
                    className="hover:text-[#1DF7CE] transition-colors inline"
                  >
                    {tag.name}
                  </button>
                  {tagIndex < tagArray.length - 1 && <span>, </span>}
                  {typeIndex < array.length - 1 && tagIndex === tagArray.length - 1 && <span>, </span>}
                </React.Fragment>
              ))
            ))}
          </div>
        </div>
        
        {/* Similar Tracks button - positioned more centrally */}
        <button className="text-white hover:text-[#1DF7CE] transition-colors mx-4 flex-shrink-0">
          <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
            fiber_smart_record
          </span>
        </button>
        
        {/* Progress bar - using all remaining space */}
        <div className="flex-1 ml-2 mr-4 flex items-center">
          <div 
            className="relative w-full"
            ref={progressBarRef}
            onClick={handleProgressBarClick}
          >
            {/* Gray track background */}
            <div className="w-full h-[8px] bg-[#3A3A3A] rounded-full cursor-pointer" />
            
            {/* Teal progress fill */}
            <div 
              className="absolute top-0 left-0 h-[8px] bg-[#1DF7CE] rounded-full"
              style={{ width: `${progress}%`, zIndex: 2 }}
            />
            
            {/* Teal dot at the edge of progress */}
            <div 
              ref={thumbRef}
              onMouseDown={handleThumbMouseDown}
              className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-[#1DF7CE] cursor-pointer"
              style={{ 
                left: `calc(${progress}% - 2px)`, 
                zIndex: 3,
                transform: 'translateY(-50%)'
              }}
            />
          </div>
        </div>
        
        {/* Duration - fixed width */}
        <div className="w-24 text-[12.5px] font-normal text-[#999999] whitespace-nowrap mr-4 flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(track.duration)}
        </div>
        
        {/* Action buttons - fixed width with text instead of icons */}
        <div className="flex items-center justify-end space-x-3 flex-shrink-0">
          {track.hasStems && (
            <button 
              onClick={() => setIsStemsOpen(!isStemsOpen)}
              className="text-white hover:text-[#1DF7CE] transition-colors text-sm px-2 focus:outline-none flex items-center"
            >
              Stems
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={isStemsOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
              </svg>
            </button>
          )}
          
          <button 
            className="w-10 h-10 flex items-center justify-center text-[#1E1E1E] hover:text-[#1DF7CE] transition-colors border-2 border-[#1DF7CE] rounded-full bg-[#1DF7CE] hover:bg-transparent focus:outline-none"
            onClick={() => window.open(track.audioUrl, '_blank')}
            title="Download track"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Stems dropdown - modify this if needed */}
      {isStemsOpen && track.stems && (
        <div className="bg-[#232323] rounded-b p-4 pt-2">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[#1DF7CE] font-bold text-[15px]">Stems</h4>
            <button 
              onClick={() => setIsStemsOpen(false)}
              className="text-white hover:text-[#1DF7CE]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {track.stems.map(stem => (
              <div 
                key={stem.id} 
                className="border border-[#3C3C3C] rounded p-3 flex items-center"
              >
                <div className="w-24 mr-3">
                  <p className="font-bold text-xs text-white truncate">{stem.name}</p>
                </div>
                
                <button 
                  onClick={() => handleStemPlayPause(stem.id)}
                  className={`w-8 h-8 flex items-center justify-center ${
                    stemLoadErrors[stem.id] ? 'text-amber-500' : 
                    stemLoading[stem.id] ? 'text-gray-400' : 'text-white'
                  } hover:text-[#1DF7CE] mr-3`}
                  disabled={false}
                  title={
                    stemLoadErrors[stem.id] ? "Audio unavailable - Click to simulate playback" : 
                    stemLoading[stem.id] ? "Loading stem audio..." : 
                    playingStems[stem.id] ? "Pause stem" : "Play stem"
                  }
                >
                  {stemLoadErrors[stem.id] ? (
                    playingStems[stem.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="4" width="4" height="16" stroke="none" fill="currentColor" />
                        <rect x="14" y="4" width="4" height="16" stroke="none" fill="currentColor" />
                        <circle cx="20" cy="4" r="2" fill="currentColor" />
            </svg>
          ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        <circle cx="19" cy="5" r="2" fill="currentColor" />
                      </svg>
                    )
                  ) : stemLoading[stem.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"></circle>
                      <path d="M12 2C6.5 2 2 6.5 2 12"></path>
                    </svg>
                  ) : playingStems[stem.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16" stroke="none" fill="currentColor" />
                      <rect x="14" y="4" width="4" height="16" stroke="none" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  )}
                </button>
                
                {/* Progress bar for stems */}
                <div className="flex-grow h-4 bg-[#3A3A3A] rounded mx-2 relative">
                  {stemLoadErrors[stem.id] ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400">
                        {playingStems[stem.id] ? 'Simulating playback' : 'Audio unavailable'}
                      </div>
                      {playingStems[stem.id] && (
                        <div 
                          className="absolute top-0 left-0 h-4 rounded bg-amber-500/30"
                          style={{ width: `${stemProgress[stem.id] || 0}%` }}
                        />
                      )}
                    </>
                  ) : (
                    <div 
                      className={`absolute top-0 left-0 h-4 rounded ${playingStems[stem.id] ? 'bg-[#1DF7CE]' : 'bg-[#555555]'}`}
                      style={{ width: `${stemProgress[stem.id] || 0}%` }}
                    />
                  )}
                </div>
                
                <div className="w-16 text-white text-xs font-normal text-right mr-3">
                  {formatTime(stem.duration)}
                </div>
                
                <div className="flex flex-col items-center">
                  {/* New add/remove button design with + or Cart with X */}
                  {stemAddedToCart[stem.id] ? (
        <button 
                      onClick={() => handleStemRemoveFromCart(stem)}
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-red-500 text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove from cart"
                    >
                      {/* Cart with X icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                        <line x1="15" y1="8" x2="9" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="14" />
            </svg>
        </button>
                  ) : (
                    <button 
                      onClick={() => handleStemAddToCart(stem)}
                      className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#1DF7CE] text-[#1DF7CE] hover:bg-[#1DF7CE]/10 transition-colors"
                      title="Add to cart"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </button>
                  )}
                  <span className="mt-1 text-xs text-[#999999]">€{stem.price}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Buy all stems button */}
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-xs text-[#999999]">Buy all stems:</p>
              <p className="text-[#1DF7CE] font-bold">€{discountedStemsPrice} <span className="line-through text-[#999999] text-xs font-normal">€{totalStemsPrice}</span></p>
            </div>
            <button
              onClick={handleDownloadAllStems}
              className="bg-[#1DF7CE] hover:bg-[#19d9b6] text-[#1E1E1E] px-4 py-2 rounded text-sm font-bold transition-colors"
            >
              Add to Cart
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
    </div>
  );
} 

// Add animation for the toast notification
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
