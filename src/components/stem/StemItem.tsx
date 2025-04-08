import React, { useState, useEffect } from 'react';
import { Stem, Track } from '../../types';
import { globalAudioManager } from '../../lib/audio-manager';
import { saveStemUrlToCache } from '../../utils/stem-cache';
import { findStemFile } from '../../services/strapi';

interface StemItemProps {
  stem: Stem;
  track: Track;
  onAddToCart: (stem: Stem, track: Track) => void;
  isPlaying: boolean;
  isOpen: boolean;
}

export const StemItem = ({ stem, track, onAddToCart, isPlaying, isOpen }: StemItemProps) => {
  const [progress, setProgress] = useState(0);
  const [stemPlaying, setStemPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Listen for stem-stopped events
    const handleStemStopped = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.stemId === stem.id) {
        setStemPlaying(false);
      }
    };

    document.addEventListener('stem-stopped', handleStemStopped);
    return () => {
      document.removeEventListener('stem-stopped', handleStemStopped);
    };
  }, [stem.id]);

  useEffect(() => {
    if (!isOpen) {
      // If the stem container is closed, stop playback
      if (stemPlaying && audio) {
        globalAudioManager.stop();
        setStemPlaying(false);
      }
      return;
    }

    const loadStemAudio = async () => {
      if (audio) return; // Already loaded

      try {
        setLoading(true);
        
        // Try to find the stem file
        const stemUrl = await findStemFile(stem.name, track.title);
        if (!stemUrl) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        // Create and configure audio element
        const newAudio = new Audio(stemUrl);
        newAudio.dataset.stem = stem.name;
        newAudio.dataset.track = track.title;
        newAudio.dataset.stemId = stem.id;
        newAudio.dataset.trackId = track.id;

        // Save the successful URL to cache
        saveStemUrlToCache(track.title, stem.name, stemUrl);
        
        // Set up event handlers
        newAudio.addEventListener('timeupdate', () => {
          const current = newAudio.currentTime;
          const duration = newAudio.duration || stem.duration || 30;
          setProgress((current / duration) * 100);
        });

        newAudio.addEventListener('ended', () => {
          setStemPlaying(false);
          setProgress(0);
          if (globalAudioManager.activeAudio === newAudio) {
            globalAudioManager.stop();
          }
        });

        newAudio.addEventListener('canplaythrough', () => {
          setLoading(false);
          setLoadError(false);
        });

        newAudio.addEventListener('error', () => {
          setLoadError(true);
          setLoading(false);
        });

        setAudio(newAudio);
      } catch (err) {
        console.error(`Failed to create audio element for ${stem.name}`);
        setLoadError(true);
        setLoading(false);
      }
    };

    loadStemAudio();

    // Cleanup function
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.remove();
      }
    };
  }, [stem, track, isOpen, audio]);

  const togglePlay = () => {
    if (!audio) return;
    
    if (stemPlaying) {
      globalAudioManager.stop();
      setStemPlaying(false);
    } else {
      globalAudioManager.play(audio, { stemId: stem.id, trackId: track.id });
      setStemPlaying(true);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(stem, track);
  };

  return (
    <div className="flex flex-col p-2 mb-2 bg-gray-800 rounded-md">
      <div className="flex justify-between items-center">
        <span className="text-white font-medium">{stem.name}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            disabled={loading || loadError}
            className={`px-2 py-1 rounded ${
              stemPlaying 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            } ${(loading || loadError) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Loading...' : stemPlaying ? 'Stop' : 'Play'}
          </button>
          <button
            onClick={handleAddToCart}
            className="px-2 py-1 rounded bg-green-600 hover:bg-green-700"
          >
            +${stem.price}
          </button>
        </div>
      </div>
      
      {loadError && (
        <div className="mt-2 text-red-400 text-sm">
          Failed to load stem audio.
        </div>
      )}
      
      {!loadError && (
        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}; 