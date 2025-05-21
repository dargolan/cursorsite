import { useRef, useState, useEffect, useCallback } from 'react';

export function useAudioManager({
  audioUrl,
  isPlaying,
  onStop,
  onPlay,
  trackId,
  trackTitle,
  duration: initialDuration
}: {
  audioUrl: string;
  isPlaying: boolean;
  onStop: () => void;
  onPlay: () => void;
  trackId: string;
  trackTitle: string;
  duration: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mainAudioLoaded, setMainAudioLoaded] = useState(false);
  const [mainAudioError, setMainAudioError] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      let url = audioUrl || '';
      if (!url) {
        setMainAudioError(true);
        return;
      }
      audio.src = url;
      audio.dataset.track = trackTitle;
      audio.dataset.trackId = trackId;
      audio.dataset.isMainTrack = 'true';
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleAudioEnded);
      audio.addEventListener('error', () => setMainAudioError(true));
      audio.addEventListener('canplaythrough', () => setMainAudioLoaded(true));
      audioRef.current = audio;
    } else {
      let url = audioUrl || '';
      if (!url) {
        setMainAudioError(true);
        return;
      }
      audioRef.current.src = url;
      audioRef.current.dataset.track = trackTitle;
      audioRef.current.dataset.trackId = trackId;
      audioRef.current.dataset.isMainTrack = 'true';
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }
    };
    // eslint-disable-next-line
  }, [audioUrl, trackTitle, trackId]);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || initialDuration;
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
        audioRef.current.play().catch(() => {
          setMainAudioError(true);
          onStop();
        });
      } else {
        audioRef.current.pause();
      }
    }
    // eslint-disable-next-line
  }, [isPlaying, onStop, mainAudioError]);

  // Seek handler
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        onPlay();
      }
    }
  };

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    audioRef,
    currentTime,
    setCurrentTime,
    progress,
    setProgress,
    mainAudioLoaded,
    setMainAudioLoaded,
    mainAudioError,
    setMainAudioError,
    seek,
    formatTime,
  };
} 