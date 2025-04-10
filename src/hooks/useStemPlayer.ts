import { useState, useEffect, useCallback, useRef } from 'react';
import { Stem, Track } from '../types';
import { findStemFileUrl } from '../utils/audio-helpers';
import { getStemUrlFromCache, saveStemUrlToCache } from '../utils/stem-cache';
import { useAudioPlayer } from './useAudioPlayer';
import { convertToProxyUrl } from '../utils/audio-utils';

interface UseStemPlayerOptions {
  stem: Stem;
  track: Track;
  autoPlay?: boolean;
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
      const response = await fetch(urlToValidate, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error(`Error validating URL ${urlToValidate}:`, error);
      return false;
    }
  }, []);
  
  // Clear cache for this stem if needed
  const clearCache = useCallback(() => {
    // Remove from localStorage
    try {
      const cacheKey = `${trackRef.current.title}:${stemRef.current.name}`;
      const existingCache = localStorage.getItem('stemUrlCache');
      if (existingCache) {
        const cache = JSON.parse(existingCache);
        if (cache[cacheKey]) {
          delete cache[cacheKey];
          localStorage.setItem('stemUrlCache', JSON.stringify(cache));
          console.log(`Cleared cache for ${cacheKey}`);
        }
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
      // 1. Check built-in URL from stem object first (if it exists and we haven't tried before)
      if (stemRef.current.url && retryCount === 0 && !forceRefresh) {
        console.log(`Trying stem's built-in URL: ${stemRef.current.url}`);
        const isValid = await validateUrl(stemRef.current.url);
        
        if (isValid) {
          console.log(`✅ Built-in URL is valid: ${stemRef.current.url}`);
          setUrl(stemRef.current.url);
          setIsLoading(false);
          return;
        } else {
          console.log(`❌ Built-in URL failed validation: ${stemRef.current.url}`);
        }
      }
      
      // 2. Check cache next (if we're not forcing a refresh)
      if (!forceRefresh) {
        const cachedUrl = getStemUrlFromCache(trackRef.current.title, stemRef.current.name);
        if (cachedUrl) {
          console.log(`Found URL in cache: ${cachedUrl}`);
          
          // Validate the cached URL
          const isValid = await validateUrl(cachedUrl);
          
          if (isValid) {
            console.log(`✅ Cached URL is valid: ${cachedUrl}`);
            setUrl(cachedUrl);
            setIsLoading(false);
            return;
          } else {
            console.log(`❌ Cached URL failed validation, clearing cache`);
            clearCache();
          }
        }
      }
      
      // 3. Try alternative URLs from stem object if available
      if (stemRef.current.alternativeUrl && retryCount <= 1) {
        try {
          const altUrls = JSON.parse(stemRef.current.alternativeUrl);
          if (Array.isArray(altUrls) && altUrls.length > 0) {
            console.log(`Trying ${altUrls.length} alternative URLs`);
            
            for (const altUrl of altUrls) {
              const isValid = await validateUrl(altUrl);
              if (isValid) {
                console.log(`✅ Alternative URL is valid: ${altUrl}`);
                setUrl(altUrl);
                saveStemUrlToCache(trackRef.current.title, stemRef.current.name, altUrl);
                setIsLoading(false);
                return;
              }
            }
            console.log(`❌ All alternative URLs failed validation`);
          }
        } catch (e) {
          console.warn(`Error parsing alternativeUrl: ${e}`);
        }
      }
      
      // 4. If not found or not valid, search for the stem file
      console.log(`Searching for stem file: ${stemRef.current.name} in ${trackRef.current.title}`);
      const stemUrl = await findStemFileUrl(stemRef.current.name, trackRef.current.title);
      
      if (stemUrl) {
        console.log(`✅ Found stem URL: ${stemUrl}`);
        // Save to cache for future use
        saveStemUrlToCache(trackRef.current.title, stemRef.current.name, stemUrl);
        setUrl(stemUrl);
        setIsLoading(false);
      } else {
        // Try to use a proxy URL as last resort
        const proxyUrl = convertToProxyUrl(stemRef.current.url || '');
        if (proxyUrl && proxyUrl !== stemRef.current.url) {
          console.log(`Trying proxy URL as last resort: ${proxyUrl}`);
          const isValid = await validateUrl(proxyUrl);
          
          if (isValid) {
            console.log(`✅ Proxy URL is valid: ${proxyUrl}`);
            setUrl(proxyUrl);
            saveStemUrlToCache(trackRef.current.title, stemRef.current.name, proxyUrl);
            setIsLoading(false);
            return;
          }
        }
        
        setError(`Could not find stem "${stemRef.current.name}" for track "${trackRef.current.title}"`);
        setIsLoading(false);
      }
    } catch (err) {
      setError(`Error loading stem: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
    }
  }, [validateUrl, clearCache, retryCount, autoPlay]);
  
  // Load the stem URL when component mounts or when stem/track changes
  useEffect(() => {
    // Reset retry count when stem or track changes
    setRetryCount(0);
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