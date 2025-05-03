'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Tag, Track } from '../types';
import { useCart } from '../contexts/CartContext';
import { getTrackCoverImageUrl } from '../utils/media-helpers';
import { getProxiedMediaUrl } from '../utils/media-helpers';
import { unifiedAudioManager } from '../lib/unified-audio-manager';

// Simple format time helper function (mm:ss)
const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTagClick: (tag: Tag) => void;
}

export default function SimplifiedAudioPlayer({ 
  track, 
  isPlaying,
  onPlay,
  onStop,
  onTagClick,
}: AudioPlayerProps): React.ReactElement {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  
  // Add cart context
  const { addItem } = useCart();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [mainAudioLoaded, setMainAudioLoaded] = useState(false);
  const [mainAudioError, setMainAudioError] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  
  // Track tags state
  const [trackTags, setTrackTags] = useState<Tag[]>(track.tags || []);
  
  // Group tags by type for display
  const tagsByType = (trackTags || []).reduce<Record<string, Tag[]>>((acc, tag) => {
    // Only include genre and mood tags, not instrument tags
    const effectiveType = tag.type || 'genre';
    
    // Skip instrument tags
    if (effectiveType === 'instrument') {
      return acc;
    }
    
    // Initialize array if needed
    if (!acc[effectiveType]) {
      acc[effectiveType] = [];
    }
    
    // Add tag to appropriate category
    acc[effectiveType].push(tag);
    
    return acc;
  }, {});
  
  // Also filter trackTags for the fallback display in case tagsByType is empty
  const filteredTrackTags = trackTags.filter(tag => (tag.type || 'genre') !== 'instrument');
  
  // Get audio manager
  const audioManager = unifiedAudioManager;
  
  // Listen for time updates from the UnifiedAudioManager
  useEffect(() => {
    if (!audioRef.current) return;
    
    const handleAudioEvent = (event: any) => {
      if (event.type === 'timeupdate' && event.trackId === track.id) {
        // Update local time state
        setCurrentTime(event.time);
        if (audioRef.current && (audioRef.current.duration || track.duration)) {
          setProgress((event.time / (audioRef.current.duration || track.duration)) * 100);
        }
      }
    };
    
    // Subscribe to audio events from the UnifiedAudioManager
    const unsubscribe = audioManager.addEventListener(handleAudioEvent);
    
    return () => {
      unsubscribe();
    };
  }, [audioManager, track.id, track.duration]);
  
  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      // Create audio with cross-origin settings
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      
      // Get audio URL
      let audioUrl = track.audioUrl;
      if (!audioUrl || audioUrl.trim() === '') {
        // Create a sanitized track title for the URL
        const sanitizedTitle = track.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        audioUrl = `/api/direct-s3/tracks/${track.id}/main.mp3`;
      }
      
      // Proxy the audio URL if needed
      audio.src = getProxiedMediaUrl(audioUrl);
      
      // Add data attributes for identification
      audio.dataset.track = track.title;
      audio.dataset.trackId = track.id;
      
      // Add event listeners
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleAudioEnded);
      
      // Add error and canplaythrough handlers
      audio.addEventListener('error', () => {
        console.error(`Error loading audio for track: ${track.title}`);
        setMainAudioError(true);
      });
      
      audio.addEventListener('canplaythrough', () => {
        setMainAudioLoaded(true);
      });

      audioRef.current = audio;
    } else {
      // Update existing audio element
      let audioUrl = track.audioUrl;
      if (!audioUrl || audioUrl.trim() === '') {
        const sanitizedTitle = track.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        audioUrl = `/api/direct-s3/tracks/${track.id}/main.mp3`;
      }
      
      audioRef.current.src = getProxiedMediaUrl(audioUrl);
      audioRef.current.dataset.track = track.title;
      audioRef.current.dataset.trackId = track.id;
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, [track.audioUrl, track.title, track.id]);
  
  // Handle time updates from audio element
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || track.duration;
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
        console.log(`[SimplifiedAudioPlayer] Playing track: ${track.title}`);
        audioManager.play(audioRef.current, { trackId: track.id })
          .catch((error: Error) => {
            console.error(`[SimplifiedAudioPlayer] Error playing track ${track.title}:`, error);
            setMainAudioError(true);
            onStop();
          });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, onStop, mainAudioError, track.id, track.title, audioManager]);
  
  // Handle progress bar click
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newTime = percentage * (audioRef.current.duration || track.duration);
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
    
    // Start playing if needed
    if (!isPlaying) {
      onPlay();
    }
  };
  
  // Handle thumb mouse down
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsInteracting(true);
    
    // Add event listeners for drag and drop
    document.addEventListener('mousemove', handleThumbDrag);
    document.addEventListener('mouseup', handleThumbRelease);
  };
  
  // Handle thumb drag
  const handleThumbDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current || !audioRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const posX = e.clientX - rect.left;
    const percentage = posX / rect.width;
    
    const newTime = percentage * (audioRef.current.duration || track.duration);
    audioRef.current.currentTime = Math.max(0, Math.min(newTime, audioRef.current.duration || track.duration));
    setCurrentTime(audioRef.current.currentTime);
    setProgress((audioRef.current.currentTime / (audioRef.current.duration || track.duration)) * 100);
  }, [isDragging, track.duration]);
  
  // Handle thumb release
  const handleThumbRelease = useCallback(() => {
    setIsDragging(false);
    
    // Keep interaction state if we're still playing
    if (!isPlaying) {
      setIsInteracting(false);
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleThumbDrag);
    document.removeEventListener('mouseup', handleThumbRelease);
  }, [handleThumbDrag, isPlaying]);
  
  // Add/remove document event listeners when dragging state changes
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleThumbDrag);
      document.addEventListener('mouseup', handleThumbRelease);
    } else {
      document.removeEventListener('mousemove', handleThumbDrag);
      document.removeEventListener('mouseup', handleThumbRelease);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleThumbDrag);
      document.removeEventListener('mouseup', handleThumbRelease);
    };
  }, [isDragging, handleThumbDrag, handleThumbRelease]);
  
  // Handle play/pause button click
  const handlePlayPause = () => {
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };

  // Update interaction state when playing state changes
  useEffect(() => {
    if (isPlaying) {
      setIsInteracting(true);
    } else {
      setIsInteracting(false);
    }
  }, [isPlaying]);

  // Get the most reliable image URL using our utility
  const trackImageUrl = getTrackCoverImageUrl(track);
  
  return (
    <div 
      className={`relative border-b border-[#1A1A1A] ${isHovering || isInteracting ? 'bg-[#232323]' : 'bg-[#121212]'}`}
      style={{ marginBottom: "0" }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Track title, tags, and audio player section - using flex with specific widths */}
      <div className="flex items-center flex-grow w-full px-4 py-[6px]" style={{ minHeight: '84px' }}>
        {/* Track image and info - left side - fixed width */}
        <div className="flex items-center w-[384px] flex-shrink-0">
          {/* Track image with fixed width */}
          <div className="w-14 h-14 rounded overflow-hidden relative mr-4 flex-shrink-0 bg-gray-800 flex items-center justify-center">
            <div 
              className={`absolute inset-0 bg-black ${isHovering || isPlaying ? 'opacity-50' : 'opacity-0'} transition-opacity z-10`}
            />
            {!imageLoadFailed ? (
              <img 
                src={trackImageUrl} 
                alt={track.title} 
                className="object-cover w-14 h-14"
                onError={() => setImageLoadFailed(true)}
              />
            ) : (
              // Show fallback music icon SVG when image fails to load
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            )}
            
            {/* Play/Pause button overlay */}
            <button
              className={`absolute inset-0 flex items-center justify-center z-20 transition-opacity ${isHovering || isPlaying ? 'opacity-100' : 'opacity-0'}`}
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="white" 
                >
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
              ) : (
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="white" 
                >
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>
          </div>
          
          {/* Title and BPM area */}
          <div className="w-32 mr-6 flex-shrink-0">
            <h3 className="font-bold text-[15px] text-white break-words leading-tight mb-0 line-clamp-2">{track.title}</h3>
            <span className="text-[12.5px] font-normal text-[#999999] block">{track.bpm} BPM</span>
          </div>
          
          {/* Tags area */}
          <div className="w-52 mr-8 flex-shrink-0">
            <div className="text-[12.5px] font-normal text-[#999999] line-clamp-2 relative">
              {trackTags && trackTags.length > 0 && filteredTrackTags.length > 0 ? (
                // Check if tagsByType has any entries
                Object.entries(tagsByType).length > 0 ? (
                  Object.entries(tagsByType).flatMap(([type, tags], typeIndex, array) => (
                    tags.map((tag, tagIndex, tagArray) => (
                      <React.Fragment key={tag.id}>
                        <button 
                          onClick={() => onTagClick(tag)}
                          className="hover:text-[#1DF7CE] transition-colors inline-flex items-center relative z-10"
                        >
                          {tag.name}
                        </button>
                        {tagIndex < tagArray.length - 1 && <span>, </span>}
                        {typeIndex < array.length - 1 && tagIndex === tagArray.length - 1 && <span>, </span>}
                      </React.Fragment>
                    ))
                  ))
                ) : (
                  // If we have tags but no types, just display them all
                  filteredTrackTags.map((tag, tagIndex) => (
                    <React.Fragment key={tag.id || `tag-${tagIndex}`}>
                      <button 
                        onClick={() => onTagClick(tag)}
                        className="hover:text-[#1DF7CE] transition-colors inline-flex items-center relative z-10"
                      >
                        {tag.name}
                      </button>
                      {tagIndex < filteredTrackTags.length - 1 && <span>, </span>}
                    </React.Fragment>
                  ))
                )
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress bar, duration, and buttons - fixed layout with reliable spacing */}
        <div className="flex items-center justify-between flex-grow pl-24">
          {/* Progress bar - fixed width */}
          <div className="w-[calc(100%-240px)] min-w-[200px]">
            <div 
              className="relative w-full"
              ref={progressBarRef}
              onClick={handleProgressBarClick}
            >
              {/* Gray track background */}
              <div className="w-full h-[8px] bg-[#3A3A3A] rounded-full cursor-pointer" />
              
              {/* Teal progress fill */}
              <div 
                className="absolute top-0 left-0 h-[8px] bg-[#1DF7CE] rounded-full"
                style={{ width: `${progress}%`, zIndex: 2 }}
              />
              
              {/* Teal dot at the edge of progress */}
              <div 
                ref={thumbRef}
                onMouseDown={handleThumbMouseDown}
                className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-[#1DF7CE] cursor-pointer"
                style={{ 
                  left: `calc(${progress}% - 2px)`, 
                  zIndex: 3,
                  transform: 'translateY(-50%)'
                }}
              />
            </div>
          </div>
          
          {/* Duration - fixed width with spacer */}
          <div className="w-20 text-[12.5px] font-normal text-[#999999] whitespace-nowrap ml-2 mr-24 flex-shrink-0 text-right">
            {formatTime(currentTime)} / {formatTime(audioRef.current?.duration || track.duration || 0)}
          </div>
          
          {/* Action buttons area */}
          <div className="flex items-center space-x-3 flex-shrink-0 min-w-[110px]">
            {/* Download button */}
            <button
              className="w-10 h-10 flex items-center justify-center text-[#1E1E1E] hover:text-[#1DF7CE] transition-colors border-2 border-[#1DF7CE] rounded-full bg-[#1DF7CE] hover:bg-transparent focus:outline-none"
              onClick={async () => {
                try {
                  // Fetch the file as a blob
                  const response = await fetch(track.audioUrl);
                  const blob = await response.blob();
                  
                  // Create a temporary anchor element
                  const a = document.createElement('a');
                  a.href = window.URL.createObjectURL(blob);
                  
                  // Set the download attribute with the track title as filename
                  const filename = `${track.title}.mp3`;
                  a.download = filename;
                  
                  // Append to body, click, and remove
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  
                  // Clean up the URL object
                  window.URL.revokeObjectURL(a.href);
                } catch (error) {
                  console.error('Error downloading track:', error);
                }
              }}
              title="Download track"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 