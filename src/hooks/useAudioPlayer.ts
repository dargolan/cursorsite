import { useState, useEffect, useCallback, useRef } from 'react';
import { globalAudioManager, AudioEvent } from '../lib/audio-manager';
import { createAudio, preloadAudio, convertToProxyUrl } from '../utils/audio-utils';

interface UseAudioPlayerOptions {
  trackId?: string;
  stemId?: string;
  url?: string;
  autoPlay?: boolean;
  volume?: number;
}

interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isError: boolean;
  duration: number;
  currentTime: number;
  progress: number;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const { trackId, stemId, url, autoPlay = false, volume = 1.0 } = options;
  
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    isError: false,
    duration: 0,
    currentTime: 0,
    progress: 0
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | undefined>(url);
  
  // Load audio when URL changes
  const loadAudio = useCallback(async (audioUrl: string) => {
    setState(prev => ({ ...prev, isLoading: true, isError: false }));
    
    try {
      // Use proxy URL for better CORS handling
      const proxyUrl = convertToProxyUrl(audioUrl);
      
      // Preload audio and create element
      const audio = await preloadAudio(proxyUrl);
      
      // Set volume
      audio.volume = volume;
      
      // Store audio in ref
      audioRef.current = audio;
      
      // Update state
      setState(prev => ({
        ...prev,
        isLoading: false,
        duration: audio.duration,
        isError: false
      }));
      
      // If autoPlay is enabled, play the audio
      if (autoPlay) {
        play();
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isError: true
      }));
    }
  }, [autoPlay, volume]);
  
  // Initialize audio when URL changes
  useEffect(() => {
    if (url && url !== urlRef.current) {
      urlRef.current = url;
      loadAudio(url);
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        // If this component's audio is currently playing, stop it
        if (globalAudioManager.isPlaying(trackId, stemId)) {
          globalAudioManager.stop();
        }
      }
    };
  }, [url, loadAudio, trackId, stemId]);
  
  // Listen for audio events
  useEffect(() => {
    const handleAudioEvent = (event: AudioEvent) => {
      // Only respond to events for this track/stem
      if ((trackId && event.trackId !== trackId) || 
          (stemId && event.stemId !== stemId)) {
        return;
      }
      
      switch (event.type) {
        case 'play':
          setState(prev => ({ ...prev, isPlaying: true }));
          break;
        case 'pause':
        case 'stop':
          setState(prev => ({ ...prev, isPlaying: false }));
          break;
        case 'ended':
          setState(prev => ({ ...prev, isPlaying: false, currentTime: 0, progress: 0 }));
          break;
        case 'timeupdate':
          if (event.time !== undefined && audioRef.current) {
            const duration = audioRef.current.duration || 0;
            const progress = duration > 0 ? (event.time / duration) * 100 : 0;
            setState(prev => ({ 
              ...prev, 
              currentTime: event.time || 0, 
              progress,
              duration
            }));
          }
          break;
      }
    };
    
    // Subscribe to audio events
    const unsubscribe = globalAudioManager.addEventListener(handleAudioEvent);
    
    // Clean up subscription
    return unsubscribe;
  }, [trackId, stemId]);
  
  // Play function
  const play = useCallback(() => {
    if (!audioRef.current) return;
    
    globalAudioManager.play(audioRef.current, {
      trackId,
      stemId
    });
  }, [trackId, stemId]);
  
  // Pause function
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (globalAudioManager.isPlaying(trackId, stemId)) {
      globalAudioManager.pause();
    }
  }, [trackId, stemId]);
  
  // Toggle play/pause
  const toggle = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);
  
  // Seek to a specific time
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    // Ensure time is within valid range
    const safeTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
    
    // If this is the current playing track, use the audio manager to seek
    if (globalAudioManager.isPlaying(trackId, stemId)) {
      globalAudioManager.seek(safeTime);
    } else {
      // Otherwise just update the audio element's time
      audioRef.current.currentTime = safeTime;
      
      // Update state
      setState(prev => ({
        ...prev,
        currentTime: safeTime,
        progress: (safeTime / (audioRef.current?.duration || 1)) * 100
      }));
    }
  }, [trackId, stemId]);
  
  // Seek by percentage
  const seekByPercentage = useCallback((percentage: number) => {
    if (!audioRef.current) return;
    
    // Ensure percentage is within valid range
    const safePercentage = Math.max(0, Math.min(percentage, 100));
    
    // Calculate time from percentage
    const time = (safePercentage / 100) * (audioRef.current.duration || 0);
    
    // Seek to that time
    seek(time);
  }, [seek]);
  
  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    if (!audioRef.current) return;
    
    // Ensure volume is within valid range
    const safeVolume = Math.max(0, Math.min(newVolume, 1));
    
    // Update audio element's volume
    audioRef.current.volume = safeVolume;
  }, []);
  
  return {
    ...state,
    play,
    pause,
    toggle,
    seek,
    seekByPercentage,
    setVolume,
    audio: audioRef.current
  };
} 