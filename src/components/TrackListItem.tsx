'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Track, Tag } from '../types';
import { useUnifiedAudioPlayer } from '../hooks/useUnifiedAudioPlayer';

interface TrackListItemProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export default function TrackListItem({
  track,
  isPlaying,
  onPlay,
  onStop
}: TrackListItemProps) {
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  
  // Load track audio URL
  useEffect(() => {
    const loadTrackUrl = async () => {
      setIsUrlLoading(true);
      try {
        // If track has an audioUrl, use it directly
        if (track.audioUrl) {
          setTrackUrl(track.audioUrl);
          return;
        }
        
        // Set a fallback URL using the track ID
        setTrackUrl(`/api/direct-s3/tracks/${track.id}/main.mp3`);
      } catch (error) {
        console.error(`Error loading URL for track ${track.title}:`, error);
      } finally {
        setIsUrlLoading(false);
      }
    };
    
    loadTrackUrl();
  }, [track]);
  
  // Initialize audio player
  const {
    isPlaying: isTrackPlaying,
    duration,
    currentTime,
    isLoading: isAudioLoading,
    toggle,
    seek
  } = useUnifiedAudioPlayer({
    src: trackUrl || undefined,
    trackId: track.id,
    onTimeUpdate: (time, duration) => {
      // Sync with parent component if needed
      if (isTrackPlaying && !isPlaying) {
        onPlay();
      } else if (!isTrackPlaying && isPlaying) {
        onStop();
      }
    }
  });
  
  // Format time (e.g., 2:30)
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle play button click
  const handlePlayClick = () => {
    toggle();
  };
  
  const renderTags = (tags: Tag[]) => {
    if (!tags || tags.length === 0) return null;
    
    return tags.map(tag => tag.name).join(', ');
  };
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className="flex items-center py-3 border-b border-[#272727]">
      {/* Track image */}
      <div className="flex-shrink-0 w-12 h-12 mr-4">
        <Image
          src={track.imageUrl || 'https://placehold.co/200x200/1e1e1e/1df7ce?text=Track'}
          alt={track.title}
          width={48}
          height={48}
          className="rounded object-cover"
        />
      </div>
      
      {/* Track info and player */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center mb-1">
          <h3 className="text-white font-medium text-sm">{track.title}</h3>
          <div className="text-xs text-gray-400 ml-2">
            {track.bpm} BPM
          </div>
          <div className="text-xs text-gray-400 ml-2">
            {renderTags(track.tags)}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-1 bg-[#272727] w-full rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-[#1DF7CE]" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Time display */}
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Play button */}
      <button
        className="mx-4 w-8 h-8 flex items-center justify-center bg-[#1DF7CE] rounded-full text-black hover:bg-[#1DF7CE]/90 transition-colors"
        onClick={handlePlayClick}
      >
        {isTrackPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      
      {/* Download button */}
      <button 
        className="w-8 h-8 flex items-center justify-center bg-transparent text-[#1DF7CE] rounded-full hover:bg-[#272727] transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>
      
      {/* Stems dropdown (optional) */}
      <button 
        className="ml-2 w-8 h-8 flex items-center justify-center bg-transparent text-white rounded-full hover:bg-[#272727] transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
} 