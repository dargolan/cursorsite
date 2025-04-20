import { useState, useEffect, useRef, useCallback } from 'react';
import { audioManager } from '../lib/audio-manager';

interface UseAudioPlayerProps {
  src?: string;
  autoPlay?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  stemId?: string;
  trackId?: string;
}

export function useAudioPlayer({
  src,
  autoPlay = false,
  loop = false,
  onEnded,
  onTimeUpdate,
  stemId,
  trackId,
}: UseAudioPlayerProps = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Play/pause functions
  const play = useCallback(() => {
    if (!audioRef.current) return;
    
    audioManager.play(audioRef.current, { stemId, trackId })
      .then(() => setIsPlaying(true))
      .catch(err => {
        setError(err);
        setIsPlaying(false);
      });
  }, [stemId, trackId]);
  
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
    
    audioRef.current.currentTime = Math.min(Math.max(0, time), duration);
    setCurrentTime(audioRef.current.currentTime);
  }, [duration]);
  
  // Initialize audio element
  useEffect(() => {
    if (!src) return;
    
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;
    
    // Set properties
    audio.src = src;
    audio.loop = loop;
    
    // Set up listeners
    const handleLoadStart = () => setIsLoading(true);
    const handleLoadedData = () => {
      setIsLoading(false);
      setDuration(audio.duration);
      if (autoPlay) {
        play();
      }
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime, audio.duration);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handleError = (e: ErrorEvent) => {
      setIsLoading(false);
      setError(e.error || new Error('Failed to load audio'));
    };
    
    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    
    // Clean up on unmount
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      
      // Stop and unload
      audio.pause();
      audio.src = '';
    };
  }, [src, autoPlay, loop, onTimeUpdate, onEnded, play]);

  // Listen for global stop events for this stem
  useEffect(() => {
    if (!stemId) return;
    
    const handleStemStopped = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.stemId === stemId) {
        setIsPlaying(false);
      }
    };
    
    document.addEventListener('stem-stopped', handleStemStopped);
    return () => {
      document.removeEventListener('stem-stopped', handleStemStopped);
    };
  }, [stemId]);
  
  return {
    isPlaying,
    duration,
    currentTime,
    isLoading,
    error,
    play,
    pause,
    toggle,
    seek,
    audioRef,
  };
} 