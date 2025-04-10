import React, { memo } from 'react';
import { Stem, Track } from '../../types';
import { useStemPlayer } from '../../hooks/useStemPlayer';
import { formatTime } from '../../utils/audio-utils';

interface StemItemProps {
  stem: Stem;
  track: Track;
  onAddToCart?: (stem: Stem) => void;
  onRemoveFromCart?: (stem: Stem) => void;
  inCart?: boolean;
}

function StemItem({ 
  stem, 
  track, 
  onAddToCart, 
  onRemoveFromCart, 
  inCart = false 
}: StemItemProps) {
  const { 
    isPlaying, 
    isLoading, 
    isLoadingUrl, 
    isError, 
    error, 
    toggle, 
    duration, 
    currentTime, 
    progress 
  } = useStemPlayer({ stem, track });

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(stem);
    }
  };

  const handleRemoveFromCart = () => {
    if (onRemoveFromCart) {
      onRemoveFromCart(stem);
    }
  };
  
  // Determine if the play button should be disabled
  const isDisabled = isLoadingUrl || isLoading || isError;
  
  // Calculate formatted time displays
  const currentTimeDisplay = formatTime(currentTime);
  const durationDisplay = formatTime(duration);

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center p-3 border-b border-gray-700">
      <div className="flex-grow flex items-center">
        {/* Play/Pause Button */}
        <button
          onClick={toggle}
          disabled={isDisabled}
          className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
            isDisabled 
              ? 'bg-gray-700 cursor-not-allowed opacity-50' 
              : isPlaying 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoadingUrl ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        
        {/* Stem Name and Status */}
        <div className="flex-grow">
          <h3 className="text-lg font-medium">{stem.name}</h3>
          {isError && (
            <p className="text-red-500 text-sm">{error || 'Audio unavailable'}</p>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full md:w-1/3 h-2 bg-gray-700 rounded-full mx-2 my-3 md:my-0 overflow-hidden">
        <div 
          className={`h-full rounded-full ${isPlaying ? 'bg-green-500' : 'bg-blue-500'}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Time Display */}
      <div className="text-sm text-gray-400 whitespace-nowrap mx-2">
        {currentTimeDisplay} / {durationDisplay}
      </div>
      
      {/* Price and Cart Button */}
      <div className="flex items-center mt-3 md:mt-0">
        <span className="text-lg font-semibold mr-3">€{stem.price?.toFixed(2) || '0.00'}</span>
        {inCart ? (
          <button
            onClick={handleRemoveFromCart}
            className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
          >
            Remove
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(StemItem); 