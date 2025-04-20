import { useState, useCallback, useEffect, useRef } from 'react';
import { globalAudioManager } from '../lib/audio-manager';

interface UseAudioPlaybackProps {
  trackId: string;
  stemId?: string;
  onPlay?: () => void;
  onStop?: () => void;
}

export function useAudioPlayback({ trackId, stemId, onPlay, onStop }: UseAudioPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      globalAudioManager.stop();
      setIsPlaying(false);
      onStop?.();
    } else {
      globalAudioManager.play(audioRef.current, { stemId, trackId });
      setIsPlaying(true);
      onPlay?.();
    }
  }, [isPlaying, stemId, trackId, onPlay, onStop]);

  // Handle time updates
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  }, []);

  // Handle audio ended
  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    onStop?.();
  }, [onStop]);

  // Handle stem stopped event
  useEffect(() => {
    const handleStemStopped = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.stemId === stemId && customEvent.detail.trackId === trackId) {
        setIsPlaying(false);
        setCurrentTime(0);
        onStop?.();
      }
    };

    document.addEventListener('stem-stopped', handleStemStopped);
    return () => {
      document.removeEventListener('stem-stopped', handleStemStopped);
    };
  }, [stemId, trackId, onStop]);

  // Set up audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleAudioEnded);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current = null;
      }
    };
  }, [handleTimeUpdate, handleAudioEnded]);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    handlePlayPause,
    setCurrentTime: (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    }
  };
} 