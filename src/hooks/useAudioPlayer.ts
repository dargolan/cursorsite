import { useState, useEffect, useRef, useCallback } from 'react';
import { audioManager } from '../lib/audio-manager';

interface UseAudioPlayerProps {
  src?: string;
  trackId?: string;
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
  onTimeUpdate?: (time: number, duration: number) => void;
  onEnded?: () => void;
}

export function useAudioPlayer({
  src,
  trackId,
  autoPlay = false,
  loop = false,
  volume = 1,
  onTimeUpdate,
  onEnded
}: UseAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Make an audio element on mount
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      
      // Default attributes
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      
      // Set up event listeners
      audio.addEventListener('loadstart', () => setIsLoading(true));
      audio.addEventListener('loadeddata', () => {
        setIsLoading(false);
        setIsLoaded(true);
        setDuration(audio.duration);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        if (onEnded) onEnded();
        
        // Reset to start
        audioRef.current!.currentTime = 0;
        setCurrentTime(0);
      });
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
        if (onTimeUpdate) onTimeUpdate(audio.currentTime, audio.duration);
      });
      audio.addEventListener('error', (e) => {
        setIsLoading(false);
        setError(new Error(`Failed to load audio file: ${e}`));
      });
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        
        // Clean up any global references
        if (audioManager.activeAudio === audioRef.current) {
          audioManager.stop();
        }
      }
    };
  }, [onEnded, onTimeUpdate]);
  
  // Set or update audio source
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    
    // Set new src only if it changed
    if (audio.src !== src) {
      setIsLoaded(false);
      setIsLoading(true);
      audio.src = src;
      audio.load();
    }
    
    // Apply props
    audio.loop = loop;
    audio.volume = Math.min(1, Math.max(0, volume));
    
    // Auto play if requested
    if (autoPlay && src) {
      audioManager.play(audio, { trackId });
      setIsPlaying(true);
    }
  }, [src, autoPlay, loop, volume, trackId]);
  
  // Global audio manager active changes
  useEffect(() => {
    const unsubscribe = audioManager.subscribe((activeId) => {
      // If the active ID changed and it's not this track
      if (audioManager.activeAudio !== audioRef.current && isPlaying) {
        setIsPlaying(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [isPlaying, trackId]);
  
  // Play/pause controls
  const play = useCallback(() => {
    if (!audioRef.current) return;
    
    audioManager.play(audioRef.current, { trackId });
    setIsPlaying(true);
  }, [trackId]);
  
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);
  
  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);
  
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    const constrainedTime = Math.max(0, Math.min(time, duration));
    audioRef.current.currentTime = constrainedTime;
    setCurrentTime(constrainedTime);
  }, [duration]);
  
  return {
    isPlaying,
    currentTime,
    duration,
    isLoaded,
    isLoading,
    error,
    play,
    pause,
    toggle,
    seek,
    audioRef
  };
} 