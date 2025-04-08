'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Stem, Track } from '../types';
import { TrackImage } from './track/TrackImage';
import { TrackDetails } from './track/TrackDetails';
import { StemContainer } from './stem/StemContainer';
import { globalAudioManager } from '../lib/audio-manager';
import { initStemUrlCache } from '../utils/stem-cache';

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onAddToCart: (stem: Stem, track: Track) => void;
  onTagClick: (tag: Tag) => void;
  onRemoveFromCart: (itemId: string) => void;
  openStemsTrackId: string | null;
  setOpenStemsTrackId: (id: string | null) => void;
}

// Export as default to match existing import in page.tsx
export default function AudioPlayer({ 
  track, 
  isPlaying, 
  onPlay, 
  onStop, 
  onAddToCart, 
  onTagClick,
  onRemoveFromCart,
  openStemsTrackId,
  setOpenStemsTrackId
}: AudioPlayerProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [mainAudio, setMainAudio] = useState<HTMLAudioElement | null>(null);
  
  // Initialize cache when component mounts
  useEffect(() => {
    initStemUrlCache();
  }, []);

  // Determine if this track's stems dropdown is open
  const isStemsOpen = openStemsTrackId === track.id;
  
  // Handler for toggling stems dropdown
  const toggleStems = useCallback(() => {
    if (isStemsOpen) {
      setOpenStemsTrackId(null);
    } else {
      setOpenStemsTrackId(track.id);
    }
  }, [isStemsOpen, track.id, setOpenStemsTrackId]);

  // Set up main audio element
  useEffect(() => {
    if (!track.audioUrl) return;
    
    const audio = new Audio(track.audioUrl);
    
    // Set up event handlers
    audio.addEventListener('ended', () => {
      onStop();
      // If this is the currently active audio in the global manager, clear it
      if (globalAudioManager.activeAudio === audio) {
        globalAudioManager.stop();
      }
    });
    
    setMainAudio(audio);
    
    // Cleanup function
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.remove();
      }
    };
  }, [track.audioUrl, onStop]);

  // Handle play/pause
  useEffect(() => {
    if (!mainAudio) return;
    
    if (isPlaying) {
      globalAudioManager.play(mainAudio);
    } else {
      if (globalAudioManager.activeAudio === mainAudio) {
        globalAudioManager.stop();
      }
    }
  }, [isPlaying, mainAudio]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onStop]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 transition-all duration-300 hover:bg-gray-750">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left side - Track Image */}
        <div className="md:w-1/4">
          <TrackImage
            track={track}
            isPlaying={isPlaying}
            onClick={togglePlay}
          />
        </div>
        
        {/* Right side - Track Details */}
        <div className="md:w-3/4">
          <TrackDetails
            track={track}
            onTagClick={onTagClick}
            openStemsHandler={toggleStems}
            isOpen={isStemsOpen}
          />
        </div>
      </div>
      
      {/* Stems Container - Renders only when open */}
      <StemContainer
        track={track}
        isPlaying={isPlaying}
        isOpen={isStemsOpen}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}; 