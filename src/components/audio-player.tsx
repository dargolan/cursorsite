'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Track } from '../types';
import { TrackImage } from './track/TrackImage';
import { TrackDetails } from './track/TrackDetails';
import { audioManager } from '../lib/audio-manager';

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTagClick: (tag: Tag) => void;
}

// Export as default to match existing import in page.tsx
export default function AudioPlayer({ 
  track, 
  isPlaying, 
  onPlay, 
  onStop, 
  onTagClick
}: AudioPlayerProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [mainAudio, setMainAudio] = useState<HTMLAudioElement | null>(null);
  
  // Set up main audio element
  useEffect(() => {
    if (!track.audioUrl) return;
    
    const audio = new Audio(track.audioUrl);
    
    // Set up event handlers
    audio.addEventListener('ended', () => {
      onStop();
      // If this is the currently active audio in the global manager, clear it
      if (audioManager.activeAudio === audio) {
        audioManager.stop();
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
      audioManager.play(mainAudio);
    } else {
      if (audioManager.activeAudio === mainAudio) {
        audioManager.stop();
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
          />
        </div>
      </div>
    </div>
  );
}; 