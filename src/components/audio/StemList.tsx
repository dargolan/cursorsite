'use client';

import React, { useState, useEffect } from 'react';
import { Track, Stem } from '../../types';
import { unifiedAudioManager } from '../../lib/unified-audio-manager';
import { useCart } from '../../contexts/CartContext';
import StemPlayer from '../StemPlayer';
import { STRAPI_URL } from '../../config/strapi';

interface StemListProps {
  track: Track;
  formatTime: (time: number) => string;
}

export default function StemList({
  track,
  formatTime
}: StemListProps): React.ReactElement {
  const [showAllStems, setShowAllStems] = useState(false);
  const [stemPlayingState, setStemPlayingState] = useState<Record<string, boolean>>({});
  const [stemProgress, setStemProgress] = useState<Record<string, number>>({});
  const [stemLoadErrors, setStemLoadErrors] = useState<Record<string, boolean>>({});
  const [stemLoading, setStemLoading] = useState<Record<string, boolean>>({});
  
  const { items: cartItems, addItem, removeItem } = useCart();
  
  // Check if stems are in cart
  const stemInCart = (stemId: string) => {
    return cartItems.some(item => item.id === `${track.id}-${stemId}`);
  };
  
  // Subscribe to audio events for stem playback tracking
  useEffect(() => {
    const handleAudioEvent = (event: any) => {
      if (event.type === 'play' && event.stemId) {
        // Mark this stem as playing
        setStemPlayingState(prev => ({
          ...prev,
          [event.stemId]: true
        }));
      } else if ((event.type === 'pause' || event.type === 'stop') && event.stemId) {
        // Mark stem as not playing
        setStemPlayingState(prev => ({
          ...prev,
          [event.stemId]: false
        }));
      } else if (event.type === 'timeupdate' && event.stemId) {
        // Update stem progress
        const stemId = event.stemId;
        const stem = track.stems?.find(s => s.id === stemId);
        if (stem && event.time !== undefined) {
          const progress = (event.time / stem.duration) * 100;
          setStemProgress(prev => ({
            ...prev,
            [stemId]: progress
          }));
        }
      }
    };
    
    const unsubscribe = unifiedAudioManager.addEventListener(handleAudioEvent);
    
    return () => {
      unsubscribe();
    };
  }, [track.stems]);
  
  // Handle play/pause for a stem
  const handleStemPlayPause = (stemId: string) => {
    // Get the stem
    const stem = track.stems?.find(s => s.id === stemId);
    if (!stem) return;
    
    // Toggle playing state
    const isCurrentlyPlaying = stemPlayingState[stemId];
    
    if (isCurrentlyPlaying) {
      // Pause the stem
      unifiedAudioManager.pause();
    } else {
      // Play the stem - in a real implementation, you'd load the stem URL first
      // This is just a stub for the refactoring
      setStemLoading(prev => ({ ...prev, [stemId]: true }));
      
      // Simulate loading a stem URL
      setTimeout(() => {
        setStemLoading(prev => ({ ...prev, [stemId]: false }));
        
        // Check if we have a load error (simulated here)
        const hasError = Math.random() < 0.1; // 10% chance of error for simulation
        
        if (hasError) {
          setStemLoadErrors(prev => ({ ...prev, [stemId]: true }));
          // Simulate playback anyway
          setStemPlayingState(prev => ({ ...prev, [stemId]: true }));
          
          // Start a timer to simulate progress
          const interval = setInterval(() => {
            setStemProgress(prev => {
              const currentProgress = prev[stemId] || 0;
              const newProgress = currentProgress + (100 / stem.duration / 10);
              
              if (newProgress >= 100) {
                clearInterval(interval);
                setStemPlayingState(prev => ({ ...prev, [stemId]: false }));
                return { ...prev, [stemId]: 0 };
              }
              
              return { ...prev, [stemId]: newProgress };
            });
          }, 100);
        } else {
          // In a real implementation, we'd play the actual audio
          // For this refactoring, we'll just update the state
          unifiedAudioManager.play(new Audio(), { 
            stemId: stem.id,
            trackId: track.id 
          });
        }
      }, 1000);
    }
  };
  
  // Handle downloading all stems
  const handleDownloadAllStems = () => {
    if (!track.stems) return;
    
    track.stems.forEach(stem => {
      if (stemInCart(stem.id)) {
        window.open(`${STRAPI_URL}/api/download/stem/${stem.id}`, '_blank');
      }
    });
  };
  
  // Get stems to display
  const stems = track.stems || [];
  const displayedStems = showAllStems ? stems : stems.slice(0, 5);
  
  // Check if any stems are in cart
  const anyStemsInCart = stems.some(stem => stemInCart(stem.id));
  
  if (stems.length === 0) {
    return (
      <div className="text-gray-400 text-sm text-center py-3">
        No stems available for this track
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-white font-medium">Stems</h4>
        
        {/* Download all button */}
        {anyStemsInCart && (
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
        {displayedStems.map(stem => (
          <StemPlayer 
            key={stem.id}
            stem={stem}
            track={track}
            isPlaying={stemPlayingState[stem.id] || false}
            onPlayPause={() => handleStemPlayPause(stem.id)}
            stemProgress={stemProgress[stem.id] || 0}
            stemLoadErrors={stemLoadErrors}
            stemLoading={stemLoading[stem.id] || false}
            formatTime={formatTime}
          />
        ))}
        
        {/* Show more button */}
        {stems.length > 5 && !showAllStems && (
          <button
            onClick={() => setShowAllStems(true)}
            className="w-full py-2 text-center text-[#1DF7CE] hover:text-[#1DF7CE]/80 text-sm"
          >
            Show All Stems ({stems.length})
          </button>
        )}
      </div>
    </div>
  );
} 