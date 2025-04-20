import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Stem } from '../../types';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { findStemFileUrl } from '../../utils/stem-url-manager';
import PlayButton from './PlayButton';
import WaveformVisualizer from './WaveformVisualizer';

interface StemPlayerProps {
  stem: Stem;
  trackTitle: string;
  trackId: string;
  isInCart: boolean;
  onAddToCart: (stem: Stem) => void;
  onRemoveFromCart: (stem: Stem) => void;
}

export default function StemPlayer({
  stem,
  trackTitle,
  trackId,
  isInCart,
  onAddToCart,
  onRemoveFromCart
}: StemPlayerProps) {
  const [stemUrl, setStemUrl] = useState<string | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  
  // Load stem URL
  useEffect(() => {
    const loadStemUrl = async () => {
      setIsUrlLoading(true);
      try {
        const url = await findStemFileUrl(stem.name, trackTitle);
        setStemUrl(url);
      } catch (error) {
        console.error(`Error loading stem URL for ${stem.name}:`, error);
      } finally {
        setIsUrlLoading(false);
      }
    };
    
    loadStemUrl();
  }, [stem.name, trackTitle]);
  
  // Initialize audio player
  const {
    isPlaying,
    duration,
    currentTime,
    isLoading: isAudioLoading,
    play,
    pause,
    toggle,
    seek
  } = useAudioPlayer({
    src: stemUrl || undefined,
    stemId: stem.id,
    trackId
  });
  
  // Format time (e.g., 2:30)
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col p-3 bg-[#1E1E1E] rounded-lg mb-3">
      <div className="flex items-center mb-2">
        {/* Stem name and controls */}
        <div className="flex-1">
          <div className="flex items-center">
            <PlayButton 
              isPlaying={isPlaying}
              isLoading={isUrlLoading || isAudioLoading}
              onClick={toggle}
              size="sm"
              className="mr-3"
            />
            <div>
              <h3 className="text-white font-medium">{stem.name}</h3>
              <div className="text-gray-400 text-xs flex space-x-2">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Price and cart controls */}
        <div className="flex items-center space-x-3">
          <span className="text-[#1DF7CE] font-medium">{stem.price.toFixed(2)}€</span>
          
          {isInCart ? (
            <button
              onClick={() => onRemoveFromCart(stem)}
              className="text-white bg-[#282828] hover:bg-[#333] px-3 py-1.5 rounded text-sm transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Remove
            </button>
          ) : (
            <button
              onClick={() => onAddToCart(stem)}
              className="text-black bg-[#1DF7CE] hover:bg-[#1DF7CE]/90 px-3 py-1.5 rounded text-sm transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add to Cart
            </button>
          )}
        </div>
      </div>
      
      {/* Waveform */}
      <div className="mt-2">
        {stemUrl && (
          <WaveformVisualizer
            audioUrl={stemUrl}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
            height={48}
          />
        )}
      </div>
    </div>
  );
} 