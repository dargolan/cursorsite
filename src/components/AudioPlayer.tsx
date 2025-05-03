'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Tag, Track } from '../types';
import { createAudio, convertUrlToProxyUrl } from '../lib/audio';
import { useCart } from '../contexts/CartContext';
import { getTrackCoverImageUrl } from '../utils/media-helpers';
import PlayButton from './AudioPlayer/PlayButton';
import { getTags } from '../services/strapi';

// Global audio manager to ensure only one audio source plays at a time
export const globalAudioManager = {
  activeAudio: null as HTMLAudioElement | null,
  activeTrackId: null as string | null,
  
  // Play an audio element and stop any currently playing audio
  play(audio: HTMLAudioElement, info?: { trackId?: string }) {
    // Stop any currently playing audio
    if (this.activeAudio && this.activeAudio !== audio && !this.activeAudio.paused) {
      console.log('Stopping previously playing audio');
      this.activeAudio.pause();
      
      // Reset currentTime if needed
      this.activeAudio.currentTime = 0;
    }
    
    // Set new active audio
    this.activeAudio = audio;
    this.activeTrackId = info?.trackId || null;
    
    // Play the new audio
    audio.play().catch(err => {
      console.error('Error playing audio:', err);
    });
  },
  
  // Stop the currently playing audio
  stop() {
    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause();
    }
    
    this.activeAudio = null;
    this.activeTrackId = null;
  }
};

// Utility function to check if a URL exists
async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking URL ${url}:`, error);
    return false;
  }
}

// Find the first valid URL from a list
async function findFirstValidUrl(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const isValid = await urlExists(url);
      if (isValid) {
        return url;
      }
    } catch (error) {
      console.error(`Error checking URL ${url}:`, error);
    }
  }
  return null;
}

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTagClick: (tag: Tag) => void;
  openStemsTrackId?: string | null;
  setOpenStemsTrackId?: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function AudioPlayer({ 
  track, 
  isPlaying,
  onPlay,
  onStop,
  onTagClick
}: AudioPlayerProps): React.ReactElement {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [mainAudio, setMainAudio] = useState<HTMLAudioElement | null>(null);
  const [mainAudioLoaded, setMainAudioLoaded] = useState(false);
  const [mainAudioError, setMainAudioError] = useState(false);
  const [tags, setTags] = useState<Tag[]>(track.tags || []);
  const [duration, setDuration] = useState(track.duration || 0);
  const { addItem } = useCart();
  
  // Set up audio element
  useEffect(() => {
    // Create a new audio element for the track
    const audio = createAudio(track.audioUrl);
    
    // Set up event handlers
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setMainAudioLoaded(true);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / (audio.duration || track.duration)) * 100);
    });
    
    audio.addEventListener('ended', () => {
      onStop();
      if (globalAudioManager.activeAudio === audio) {
        globalAudioManager.stop();
      }
    });
    
    audio.addEventListener('error', () => {
      console.error(`Error loading audio for track: ${track.title}`);
      setMainAudioError(true);
    });
    
    setMainAudio(audio);
    
    // Get tags if not available
    if (!track.tags || track.tags.length === 0) {
      // Load tags for this track
      getTags().then(loadedTags => {
        setTags(loadedTags);
      }).catch(error => {
        console.error(`Error loading tags for track ${track.id}:`, error);
      });
    }
    
    // Clean up on unmount
    return () => {
      audio.pause();
      audio.src = '';
      audio.remove();
      
      if (globalAudioManager.activeAudio === audio) {
        globalAudioManager.stop();
      }
    };
  }, [track.id, track.audioUrl, track.title, track.duration, track.tags, onStop]);
  
  // Handle play/pause state changes
  useEffect(() => {
    if (!mainAudio) return;
    
    if (isPlaying) {
      globalAudioManager.play(mainAudio, { trackId: track.id });
    } else {
      if (globalAudioManager.activeAudio === mainAudio) {
        mainAudio.pause();
      }
    }
  }, [isPlaying, mainAudio, track.id]);
  
  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle progress bar click
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !mainAudio) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    const newTime = percentage * (mainAudio.duration || duration);
    
    mainAudio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage * 100);
    
    if (!isPlaying) {
      onPlay();
    }
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    addItem({
      id: track.id,
      type: 'track',
      price: 9.99, // You may want to make this dynamic based on track data
      name: track.title,
      imageUrl: getTrackCoverImageUrl(track) || ''
    });
  };
  
  // Group tags by type for display
  const groupedTags = tags.reduce<Record<string, Tag[]>>((groups, tag) => {
    const type = tag.type || 'genre';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(tag);
    return groups;
  }, {});
  
  return (
    <div 
      className={`bg-gray-800 rounded-lg p-4 mb-4 transition-all duration-300 hover:bg-gray-750 ${
        isHovering ? 'shadow-xl' : 'shadow-md'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex flex-col md:flex-row">
        {/* Left side - Track image and controls */}
        <div className="md:w-1/3 relative">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            {track.imageUrl ? (
              <Image 
                src={getTrackCoverImageUrl(track) || '/placeholder.jpg'} 
                alt={track.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = '/placeholder.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 text-lg">No Image</span>
              </div>
            )}
            
            {/* Play/Pause button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <PlayButton 
                isPlaying={isPlaying} 
                onClick={isPlaying ? onStop : onPlay}
                size="lg"
                isLoading={!mainAudioLoaded && !mainAudioError}
                hasError={mainAudioError}
              />
            </div>
          </div>
          
          {/* Audio controls */}
          <div className="mt-3">
            <div className="flex items-center mb-2">
              <span className="text-gray-400 text-sm">{formatTime(currentTime)}</span>
              <div 
                ref={progressBarRef}
                className="mx-2 flex-grow h-2 bg-gray-700 rounded cursor-pointer relative"
                onClick={handleProgressBarClick}
              >
                <div 
                  className="absolute h-full bg-blue-500 rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-gray-400 text-sm">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        
        {/* Right side - Track details */}
        <div className="md:w-2/3 md:pl-6 mt-4 md:mt-0">
          <h2 className="text-xl font-bold text-white mb-2">{track.title}</h2>
          
          {/* Track metadata */}
          <div className="flex items-center text-gray-400 text-sm mb-4">
            <span className="mr-4">{track.bpm} BPM</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* Tags */}
          <div className="mb-4">
            {Object.entries(groupedTags).map(([type, typeTags]) => (
              <div key={type} className="mb-2">
                <h3 className="text-sm text-gray-400 uppercase mb-1">{type}</h3>
                <div className="flex flex-wrap gap-2">
                  {typeTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => onTagClick(tag)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm text-gray-300"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleAddToCart}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
