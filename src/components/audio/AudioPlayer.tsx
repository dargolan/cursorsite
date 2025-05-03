'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Track, Tag } from '../../types';
import { useUnifiedAudioPlayer } from '../../hooks/useUnifiedAudioPlayer';
import PlayButton from '../AudioPlayer/PlayButton';
import WaveformVisualizer from '../AudioPlayer/WaveformVisualizer';
import { useCart } from '../../contexts/CartContext';

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTagClick: (tag: Tag) => void;
}

export default function AudioPlayer({
  track,
  isPlaying,
  onPlay,
  onStop,
  onTagClick
}: AudioPlayerProps): React.ReactElement {
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const { items: cartItems, addItem, removeItem } = useCart();
  
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
        setTrackUrl(`/api/track-audio/${track.id}`);
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
  
  // Handle adding track to cart
  const handleAddToCart = () => {
    addItem({
      id: track.id,
      type: 'track',
      price: 9.99, // Fixed price or use track.price if available
      name: track.title,
      imageUrl: track.imageUrl || ''
    } as any); // Type assertion to avoid TypeScript errors
  };
  
  // Check if track is already in cart
  const isInCart = cartItems.some(item => item.id === track.id && item.type === 'track');
  
  return (
    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden flex flex-col mb-6">
      {/* Track header */}
      <div className="p-4 flex items-center">
        {/* Track image */}
        <div className="w-16 h-16 mr-4 relative bg-[#282828] rounded-md overflow-hidden flex-shrink-0">
          {track.imageUrl ? (
            <Image 
              src={track.imageUrl} 
              alt={track.title} 
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <svg className="w-8 h-8 text-[#1DF7CE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Track info */}
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{track.title}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {track.tags.map(tag => (
              <button
                key={tag.id}
                className="text-xs px-2 py-0.5 bg-[#282828] text-[#CDCDCD] rounded-full hover:bg-[#333]"
                onClick={() => onTagClick(tag)}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex-shrink-0 flex items-center">
          <PlayButton 
            isPlaying={isTrackPlaying}
            isLoading={isUrlLoading || isAudioLoading}
            onClick={toggle}
            size="md"
            className="mr-4"
          />
          
          {isInCart ? (
            <button 
              className="flex items-center text-sm px-3 py-1.5 rounded bg-[#282828] text-white hover:bg-[#333] transition-colors"
              onClick={() => removeItem(track.id)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove
            </button>
          ) : (
            <button 
              className="flex items-center text-sm px-3 py-1.5 rounded bg-[#1DF7CE] text-black hover:bg-[#1DF7CE]/90 transition-colors"
              onClick={handleAddToCart}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add to Cart
            </button>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="px-4 pb-4">
        {trackUrl && (
          <div className="mb-1">
            <WaveformVisualizer
              audioUrl={trackUrl}
              isPlaying={isTrackPlaying}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
              height={48}
            />
          </div>
        )}
        
        <div className="flex justify-between text-gray-400 text-xs">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Track details */}
      <div className="px-4 pb-4 border-t border-[#282828] pt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-sm mr-2">BPM:</span>
            <span className="text-white text-sm">{track.bpm}</span>
          </div>
          
          <div>
            <span className="text-gray-400 text-sm mr-2">Duration:</span>
            <span className="text-white text-sm">{formatTime(track.duration || duration)}</span>
          </div>
          
          <div>
            <span className="text-gray-400 text-sm mr-2">Price:</span>
            <span className="text-white text-sm">$9.99</span>
          </div>
        </div>
      </div>
    </div>
  );
} 