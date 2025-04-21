'use client';

import React, { useState, useEffect } from 'react';
import { audioManager, AudioEvent } from '../lib/audio-manager';
import { globalAudioController } from '../lib/global-audio-controller';
import { keyboardShortcuts } from '../lib/keyboard-shortcuts';

interface AudioStatusIndicatorProps {
  showKeyboardTips?: boolean;
}

export default function AudioStatusIndicator({ 
  showKeyboardTips = true 
}: AudioStatusIndicatorProps): React.ReactElement | null {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [activeStemId, setActiveStemId] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState<{title?: string, artist?: string}>({});
  const [showTips, setShowTips] = useState(false);
  
  // Initialize keyboard shortcuts
  useEffect(() => {
    keyboardShortcuts.init();
    return () => keyboardShortcuts.destroy();
  }, []);
  
  // Subscribe to global audio controller
  useEffect(() => {
    const unsubscribe = globalAudioController.subscribe((playing) => {
      setIsPlaying(playing);
    });
    
    return unsubscribe;
  }, []);
  
  // Subscribe to audio manager for track info
  useEffect(() => {
    const handleAudioEvents = (event: AudioEvent) => {
      if (event.type === 'play') {
        setActiveTrackId(event.trackId);
        setActiveStemId(event.stemId);
        
        // Fetch track info (this would normally come from your store/state management)
        if (event.trackId) {
          // This is just a placeholder - replace with your actual data fetching logic
          fetch(`/api/tracks/${event.trackId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                setTrackInfo({
                  title: data.title,
                  artist: data.artist
                });
              }
            })
            .catch(() => {
              // Fallback if API fails - just use IDs
              setTrackInfo({
                title: `Track ${event.trackId}`,
                artist: event.stemId ? `Stem: ${event.stemId}` : 'Main'
              });
            });
        }
      }
    };
    
    // Listen for audio events
    const unsubscribe = audioManager.addEventListener(handleAudioEvents);
    
    // Show keyboard tips after a delay
    if (showKeyboardTips) {
      const timer = setTimeout(() => setShowTips(true), 2000);
      return () => {
        unsubscribe(); // Use the unsubscribe function returned by addEventListener
        clearTimeout(timer);
      };
    }
    
    return () => unsubscribe(); // Use the unsubscribe function
  }, [showKeyboardTips]);
  
  // No need to render if nothing is playing and no tips to show
  if (!isPlaying && !showTips) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white rounded-lg p-3 shadow-lg z-50 max-w-xs transition-all duration-300 ease-in-out">
      {isPlaying && (
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 bg-[#1DF7CE] rounded-full mr-2 animate-pulse" />
          <div className="flex-1 truncate">
            <div className="font-semibold truncate">{trackInfo.title || 'Playing track'}</div>
            <div className="text-xs text-gray-300 truncate">{trackInfo.artist || 'Unknown artist'}</div>
          </div>
          <button 
            onClick={() => globalAudioController.pause()}
            className="ml-3 p-1 hover:bg-white hover:bg-opacity-20 rounded"
            aria-label="Pause"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6M9 5h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
          </button>
        </div>
      )}
      
      {showTips && (
        <div className="text-xs text-gray-300">
          <div className="mb-1 font-medium text-gray-200">Keyboard controls:</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div>Space</div><div>Play/Pause</div>
            <div>←</div><div>Rewind 5s</div>
            <div>→</div><div>Forward 5s</div>
          </div>
          <button 
            onClick={() => setShowTips(false)}
            className="mt-2 text-xs text-gray-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
} 