import { useState, useCallback, useEffect, useRef } from 'react';
import { audioManager } from '../lib/audio-manager';

interface UseAudioPlaybackProps {
  trackId: string;
  onPlay?: () => void;
  onStop?: () => void;
}

export function useAudioPlayback({ trackId, onPlay, onStop }: UseAudioPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioManager.stop();
      setIsPlaying(false);
      onStop?.();
    } else {
      audioManager.play(audioRef.current, { trackId });
      setIsPlaying(true);
      onPlay?.();
    }
  }, [isPlaying, trackId, onPlay, onStop]);

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