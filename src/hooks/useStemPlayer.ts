import { useState, useEffect, useCallback, useRef } from 'react';
import { Stem, Track } from '../types';
import { findStemFileUrl } from '../utils/audio-helpers';
import { getStemUrlFromCache, saveStemUrlToCache, clearStemUrlCache, clearAllStemUrlCaches } from '../utils/stem-cache';
import { useAudioPlayer } from './useAudioPlayer';
import { convertUrlToProxyUrl } from '../lib/audio';

interface UseStemPlayerOptions {
  stem: Stem;
  track: Track;
  autoPlay?: boolean;
}

// Helper for stem+track validation
function validateStemBelongsToTrack(url: string, trackTitle: string, stemName: string): boolean {
  const filename = url.split('/').pop()?.toLowerCase() || '';
  
  // Normalize the track title for comparison (various formats)
  const normalizedTrackTitle = trackTitle.toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  
  // Check if filename contains the normalized track title
  if (filename.includes(normalizedTrackTitle)) {
    return true;
  }
  
  // Check if filename contains significant parts of the track title
  const trackParts = trackTitle.toLowerCase().split(/[\s-]+/).filter(part => part.length > 3);
  const hasTrackPart = trackParts.some(part => filename.includes(part));
  if (hasTrackPart && filename.includes(stemName.toLowerCase())) {
    return true;
  }
  
  return false;
}

export function useStemPlayer(options: UseStemPlayerOptions) {
  const { stem, track, autoPlay = false } = options;
  
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use refs to track current stem and track to avoid stale closures
  const stemRef = useRef(stem);
  const trackRef = useRef(track);
  
  // Update refs when props change
  useEffect(() => {
    stemRef.current = stem;
    trackRef.current = track;
  }, [stem, track]);
  
  // Create a unique ID that represents this specific stem+track combination
  const stemTrackId = `${track.id}-${stem.id}`;
  
  // Initialize the audio player with the stem ID and track ID
  const player = useAudioPlayer({
    url: url || undefined,
    stemId: stem.id,
    trackId: track.id,
    autoPlay
  });
  
  // Validate URL by checking if it's accessible
  const validateUrl = useCallback(async (urlToValidate: string): Promise<boolean> => {
    try {
      // First validate that this URL matches the expected track and stem
      const isCorrectTrackAndStem = validateStemBelongsToTrack(
        urlToValidate,
        trackRef.current.title,
        stemRef.current.name
      );
      
      if (!isCorrectTrackAndStem) {
        console.warn(`[STEM VALIDATION] URL does not match expected track and stem: ${urlToValidate}`);
        return false;
      }
      
      const response = await fetch(urlToValidate, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Error validating URL ${urlToValidate}:`, error);
      return false;
    }
  }, []);
  
  // Clear cache for this stem if needed
  const clearCache = useCallback(() => {
    // Remove from localStorage with specific track ID
    try {
      // Use more specific cache key that includes track ID
      if (trackRef.current && trackRef.current.id) {
        clearStemUrlCache(trackRef.current.id, trackRef.current.title, stemRef.current.name);
        console.log(`[CACHE] Cleared cache for ${stemRef.current.name} in ${trackRef.current.title}`);
      }
    } catch (e) {
      console.warn('Failed to clear localStorage cache:', e);
    }
  }, []);
  
  // Load the stem URL
  const loadStemUrl = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Make sure we have required data
      if (!trackRef.current || !trackRef.current.id || !trackRef.current.title) {
        throw new Error('Invalid track data');
      }
      
      if (!stemRef.current || !stemRef.current.name) {
        throw new Error('Invalid stem data');
      }
      
      const trackId = trackRef.current.id;
      const trackTitle = trackRef.current.title;
      const stemName = stemRef.current.name;
      
      console.log(`[STEM LOAD] Loading stem ${stemName} for track ${trackTitle} (ID: ${trackId})`);
      
      // If we're forcing a refresh, clear any cached URL first
      if (forceRefresh) {
        clearCache();
      }
      
      // 1. Check cache first (if we're not forcing a refresh)
      if (!forceRefresh) {
        // Get from cache with track ID-specific key
        const cachedUrl = getStemUrlFromCache(trackId, trackTitle, stemName);
        if (cachedUrl) {
          console.log(`[STEM LOAD] Found URL in cache: ${cachedUrl}`);
          
          // Double-check that the cached URL matches the expected track
          const urlMatchesTrack = validateStemBelongsToTrack(
            cachedUrl,
            trackTitle,
            stemName
          );
          
          if (!urlMatchesTrack) {
            console.log(`[STEM LOAD] ⚠️ Cached URL doesn't match expected track: ${cachedUrl}`);
            clearCache(); // Remove invalid cache entry
          } else {
            // Validate the cached URL is accessible
            const isValid = await validateUrl(cachedUrl);
            
            if (isValid) {
              console.log(`[STEM LOAD] ✅ Cached URL is valid: ${cachedUrl}`);
              setUrl(cachedUrl);
              setIsLoading(false);
              return;
            } else {
              console.log(`[STEM LOAD] ❌ Cached URL failed validation, clearing cache`);
              clearCache();
            }
          }
        }
      }

      // 2. Check built-in URL from stem object and convert to proxy if needed
      if (stemRef.current.url) {
        const proxyUrl = convertUrlToProxyUrl(stemRef.current.url);
        console.log(`[STEM LOAD] Trying stem's built-in URL as proxy: ${proxyUrl}`);
        
        // Validate this URL matches the expected track
        const urlMatchesTrack = validateStemBelongsToTrack(
          proxyUrl,
          trackTitle,
          stemName
        );
        
        if (!urlMatchesTrack) {
          console.log(`[STEM LOAD] ⚠️ Built-in URL doesn't match expected track: ${proxyUrl}`);
        } else {
          const isValid = await validateUrl(proxyUrl);
          
          if (isValid) {
            console.log(`[STEM LOAD] ✅ Built-in proxy URL is valid: ${proxyUrl}`);
            setUrl(proxyUrl);
            saveStemUrlToCache(trackId, trackTitle, stemName, proxyUrl);
            setIsLoading(false);
            return;
          } else {
            console.log(`[STEM LOAD] ❌ Built-in proxy URL failed validation: ${proxyUrl}`);
          }
        }
      }
      
      // 3. Try alternative URLs from stem object if available
      if (stemRef.current.alternativeUrl) {
        try {
          const altUrls = JSON.parse(stemRef.current.alternativeUrl);
          if (Array.isArray(altUrls) && altUrls.length > 0) {
            console.log(`[STEM LOAD] Trying ${altUrls.length} alternative URLs`);
            
            for (const altUrl of altUrls) {
              // Convert to proxy URL
              const proxyAltUrl = convertUrlToProxyUrl(altUrl);
              
              // Verify URL belongs to this track first
              const urlMatchesTrack = validateStemBelongsToTrack(
                proxyAltUrl,
                trackTitle,
                stemName
              );
              
              if (!urlMatchesTrack) {
                console.log(`[STEM LOAD] ⚠️ Alternative URL doesn't match track: ${proxyAltUrl}`);
                continue; // Skip to next URL
              }
              
              const isValid = await validateUrl(proxyAltUrl);
              if (isValid) {
                console.log(`[STEM LOAD] ✅ Alternative URL is valid: ${proxyAltUrl}`);
                setUrl(proxyAltUrl);
                saveStemUrlToCache(trackId, trackTitle, stemName, proxyAltUrl);
                setIsLoading(false);
                return;
              }
            }
            console.log(`[STEM LOAD] ❌ All alternative URLs failed validation`);
          }
        } catch (e) {
          console.warn(`[STEM LOAD] Error parsing alternativeUrl: ${e}`);
        }
      }
      
      // 4. If not found or not valid, search for the stem file
      console.log(`[STEM LOAD] Searching for stem file: ${stemName} in ${trackTitle}`);
      const stemUrl = await findStemFileUrl(trackId, trackTitle, stemName);
      
      if (stemUrl) {
        console.log(`[STEM LOAD] ✅ Found stem URL: ${stemUrl}`);
        
        // Final validation to ensure the URL actually belongs to this track
        const urlMatchesTrack = validateStemBelongsToTrack(
          stemUrl,
          trackTitle,
          stemName
        );
        
        if (!urlMatchesTrack) {
          console.log(`[STEM LOAD] ⚠️ Found URL doesn't match expected track: ${stemUrl}`);
          setError(`Found stem "${stemName}" that doesn't match track "${trackTitle}"`);
          setIsLoading(false);
          return;
        }
        
        // Already saved to cache in findStemFileUrl
        setUrl(stemUrl);
        setIsLoading(false);
      } else {
        setError(`Could not find stem "${stemName}" for track "${trackTitle}"`);
        setIsLoading(false);
      }
    } catch (err) {
      setError(`Error loading stem: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
    }
  }, [validateUrl, clearCache, retryCount]);
  
  // When component first mounts, clear any potentially incorrect cached entries
  useEffect(() => {
    // This is a one-time safety check to prevent mixing stems
    if (track && track.id && stem && stem.name) {
      // Check if there's any cached URL for this stem+track
      const cachedUrl = getStemUrlFromCache(track.id, track.title, stem.name);
      if (cachedUrl) {
        // Validate it matches the expected track
        const isValid = validateStemBelongsToTrack(cachedUrl, track.title, stem.name);
        if (!isValid) {
          console.log(`[STEM INIT] 🧹 Clearing invalid cached URL for ${stem.name} in ${track.title}: ${cachedUrl}`);
          clearStemUrlCache(track.id, track.title, stem.name);
        }
      }
    }
  }, []);
  
  // Load the stem URL when component mounts or when stem/track changes
  useEffect(() => {
    // Reset retry count and URL when stem or track changes
    setRetryCount(0);
    setUrl(null);
    loadStemUrl(false);
  }, [stemTrackId, loadStemUrl]);
  
  // Function to reload/retry loading the stem
  const reload = useCallback(() => {
    setRetryCount(prevCount => prevCount + 1);
    loadStemUrl(true);
  }, [loadStemUrl]);
  
  return {
    ...player,
    isLoadingUrl: isLoading,
    error,
    url,
    reload
  };
} 