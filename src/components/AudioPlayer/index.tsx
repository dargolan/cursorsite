'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Track, Tag, Stem } from '../../types';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useCart } from '../../contexts/CartContext';
import { findStemFileUrl } from '../../utils/stem-url-manager';
import { STRAPI_URL } from '../../services/strapi';
import PlayButton from './PlayButton';
import WaveformVisualizer from './WaveformVisualizer';
import StemPlayer from './StemPlayer';

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTagClick: (tag: Tag) => void;
  openStemsTrackId: string | null;
  setOpenStemsTrackId: (id: string | null) => void;
}

export default function AudioPlayer({
  track,
  isPlaying,
  onPlay,
  onStop,
  onTagClick,
  openStemsTrackId,
  setOpenStemsTrackId
}: AudioPlayerProps): React.ReactElement {
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [showAllStems, setShowAllStems] = useState(false);
  
  const { items: cartItems, addItem, removeItem } = useCart();
  
  // Check if stems are expanded
  const stemsExpanded = openStemsTrackId === track.id;
  
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
        
        // Otherwise try to find the main stem URL
        const url = await findStemFileUrl('Main', track.title);
        setTrackUrl(url);
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
  } = useAudioPlayer({
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
  
  // Handle adding stem to cart
  const handleStemAddToCart = (stem: Stem) => {
    const stemItem = {
      id: `${track.id}-${stem.id}`,
      name: stem.name,
      trackName: track.title,
      price: stem.price,
      imageUrl: track.imageUrl || '',
      type: 'stem' as const,
      stemId: stem.id,
      trackId: track.id
    };
    
    addItem(stemItem);
  };
  
  // Handle removing stem from cart
  const handleStemRemoveFromCart = (stem: Stem) => {
    removeItem(`${track.id}-${stem.id}`);
  };
  
  // Check if a stem is in the cart
  const isStemInCart = (stem: Stem): boolean => {
    return cartItems.some(item => item.id === `${track.id}-${stem.id}`);
  };
  
  // Toggle stems panel
  const handleToggleStems = () => {
    if (stemsExpanded) {
      setOpenStemsTrackId(null);
    } else {
      setOpenStemsTrackId(track.id);
    }
  };
  
  // Download all stems
  const handleDownloadAllStems = () => {
    const stems = track.stems || [];
    stems.forEach(stem => {
      // Only download stems that are in the cart
      if (isStemInCart(stem)) {
        window.open(`${STRAPI_URL}/api/download/stem/${stem.id}`, '_blank');
      }
    });
  };
  
  // Extract stems with null check
  const stems = track.stems || [];
  
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
          
          <button 
            className={`flex items-center text-sm px-3 py-1.5 rounded ${
              stemsExpanded 
                ? 'bg-[#1DF7CE] text-black hover:bg-[#1DF7CE]/90' 
                : 'bg-[#282828] text-white hover:bg-[#333]'
            } transition-colors`}
            onClick={handleToggleStems}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            Stems {stems.length > 0 && `(${stems.length})`}
          </button>
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
      
      {/* Stems panel */}
      {stemsExpanded && (
        <div className="px-4 pb-4 border-t border-[#282828] pt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white font-medium">Stems</h4>
            
            {/* Only show download all button if there are stems in cart */}
            {stems.some(stem => isStemInCart(stem)) && (
              <button
                onClick={handleDownloadAllStems}
                className="text-[#1DF7CE] text-sm flex items-center hover:text-[#1DF7CE]/80 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All
              </button>
            )}
          </div>
          
          {/* Stem list */}
          <div className="space-y-3">
            {stems.length === 0 ? (
              <p className="text-gray-400 text-sm">No stems available for this track.</p>
            ) : (
              <>
                {/* Show the first few stems or all stems if showAllStems is true */}
                {(showAllStems ? stems : stems.slice(0, 3)).map(stem => (
                  <StemPlayer
                    key={stem.id}
                    stem={stem}
                    trackTitle={track.title}
                    trackId={track.id}
                    isInCart={isStemInCart(stem)}
                    onAddToCart={handleStemAddToCart}
                    onRemoveFromCart={handleStemRemoveFromCart}
                  />
                ))}
                
                {/* "Show more" button if there are more than 3 stems */}
                {stems.length > 3 && !showAllStems && (
                  <button
                    className="w-full py-2 text-sm text-[#1DF7CE] hover:text-[#1DF7CE]/80 transition-colors"
                    onClick={() => setShowAllStems(true)}
                  >
                    Show {stems.length - 3} more stem{stems.length - 3 > 1 ? 's' : ''}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 