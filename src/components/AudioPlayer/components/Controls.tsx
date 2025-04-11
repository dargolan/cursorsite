'use client';

import React, { useRef, useEffect, useState } from 'react';
import { audioManager } from '../AudioManager';

interface ControlsProps {
  audioUrl: string;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

export function Controls({
  audioUrl,
  isPlaying,
  onPlay,
  onStop,
  onTimeUpdate,
  onDurationChange
}: ControlsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.addEventListener('timeupdate', () => {
        const time = audioRef.current?.currentTime || 0;
        setCurrentTime(time);
        onTimeUpdate?.(time);
      });

      audioRef.current.addEventListener('durationchange', () => {
        const dur = audioRef.current?.duration || 0;
        setDuration(dur);
        onDurationChange?.(dur);
      });

      audioRef.current.addEventListener('ended', () => {
        onStop();
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl, onTimeUpdate, onDurationChange, onStop]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioManager.play(audioRef.current);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleSeek = (percentage: number) => {
    if (audioRef.current && duration) {
      const newTime = duration * percentage;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={isPlaying ? onStop : onPlay}
        className="p-2 rounded-full bg-[#1DF7CE] hover:bg-[#19d9b6] transition-colors"
      >
        {isPlaying ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h4v12H6zm8 0h4v12h-4z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex items-center space-x-2">
        <span className="text-sm">{formatTime(currentTime)}</span>
        <div
          className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const percentage = (e.clientX - rect.left) / rect.width;
            handleSeek(percentage);
          }}
        >
          <div
            className="h-full bg-[#1DF7CE] rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <span className="text-sm">{formatTime(duration)}</span>
      </div>
    </div>
  );
} 