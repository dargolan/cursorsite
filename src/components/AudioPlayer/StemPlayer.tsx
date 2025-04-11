'use client';

import React from 'react';
import { StemPlayerProps } from './types';
import { ProgressBar } from './ProgressBar';

export const StemPlayer: React.FC<StemPlayerProps> = ({
  stem,
  isPlaying,
  progress,
  onPlayPause,
  onProgressChange,
  isInCart,
  onAddToCart,
  onRemoveFromCart,
  hasError,
  isLoading
}) => {
  return (
    <div className="rounded p-3 flex items-center hover:bg-[#2A2A2A] transition-colors">
      <div className="w-14 mr-2">
        <p className="font-bold text-xs text-white break-words leading-tight">{stem.name}</p>
      </div>

      <button 
        onClick={onPlayPause}
        className={`w-8 h-8 flex items-center justify-center ${
          hasError ? 'text-amber-500' : 
          isLoading ? 'text-gray-400' : 'text-white'
        } hover:text-[#1DF7CE] mr-2`}
        disabled={false}
        title={
          hasError ? "Audio unavailable - Click to simulate playback" : 
          isLoading ? "Loading stem audio..." : 
          isPlaying ? "Pause stem" : "Play stem"
        }
      >
        {hasError ? (
          isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" fill="currentColor" />
              <circle cx="20" cy="4" r="2" fill="currentColor" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
              <circle cx="19" cy="5" r="2" fill="currentColor" />
            </svg>
          )
        ) : isLoading ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"></circle>
            <path d="M12 2C6.5 2 2 6.5 2 12"></path>
          </svg>
        ) : isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" fill="currentColor" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
          </svg>
        )}
      </button>

      <div className="flex-grow mx-1" style={{ maxWidth: "calc(62% - 50px)" }}>
        <ProgressBar
          progress={progress}
          duration={stem.duration}
          currentTime={stem.duration * (progress / 100)}
          onProgressChange={(percentage: number) => onProgressChange(percentage)}
          isInteractive={!hasError}
        />
      </div>

      <div className="flex flex-col items-center ml-1">
        {isInCart ? (
          <button 
            onClick={onRemoveFromCart}
            className="w-8 h-8 flex items-center justify-center text-[#1DF7CE] hover:text-[#19b8a3] transition-colors relative"
            title="Remove from cart"
          >
            <div className="animate-stroke-reveal">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle className="animate-circle-reveal" cx="12" cy="12" r="10" />
                <path className="animate-check-reveal" d="M8 12l3 3 6-6" />
              </svg>
            </div>
          </button>
        ) : (
          <button 
            onClick={onAddToCart}
            className="w-8 h-8 flex items-center justify-center text-[#1DF7CE] hover:text-[#19b8a3] transition-colors"
            title="Add to cart"
          >
            <span className="material-symbols-outlined text-[20px]">
              add_shopping_cart
            </span>
          </button>
        )}
        <span className="mt-1 text-xs text-[#999999]">€{stem.price}</span>
      </div>
    </div>
  );
}; 