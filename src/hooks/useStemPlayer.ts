import { useState, useEffect, useCallback } from 'react';
import { Stem, Track } from '../types';
import { findStemFileUrl } from '../utils/audio-helpers';
import { getStemUrlFromCache, saveStemUrlToCache } from '../utils/stem-cache';
import { useAudioPlayer } from './useAudioPlayer';

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
  
  // Initialize the audio player with the stem ID and track ID
  const player = useAudioPlayer({
    url: url || undefined,
    stemId: stem.id,
    trackId: track.id,
    autoPlay
  });
  
  // Load the stem URL
  const loadStemUrl = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cachedUrl = getStemUrlFromCache(track.title, stem.name);
      if (cachedUrl) {
        setUrl(cachedUrl);
        setIsLoading(false);
        return;
      }
      
      // If not in cache, search for the stem file
      const stemUrl = await findStemFileUrl(stem.name, track.title);
      
      if (stemUrl) {
        // Save to cache for future use
        saveStemUrlToCache(track.title, stem.name, stemUrl);
        setUrl(stemUrl);
      } else {
        setError(`Could not find stem "${stem.name}" for track "${track.title}"`);
      }
    } catch (err) {
      setError(`Error loading stem: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [stem.name, track.title, stem.id, track.id]);
  
  // Load the stem URL when component mounts
  useEffect(() => {
    loadStemUrl();
  }, [loadStemUrl]);
  
  return {
    ...player,
    isLoadingUrl: isLoading,
    error,
    url,
    reload: loadStemUrl
  };
} 