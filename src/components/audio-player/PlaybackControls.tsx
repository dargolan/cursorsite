'use client';

import React from 'react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  isLoading?: boolean;
  hasError?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onPlayPause,
  isLoading = false,
  hasError = false
}) => {
  return (
    <button
      onClick={onPlayPause}
      disabled={isLoading || hasError}
      className={`w-10 h-10 flex items-center justify-center rounded-full ${
        isPlaying
          ? 'bg-[#1DF7CE] text-black'
          : 'bg-white text-black hover:bg-[#1DF7CE] transition-colors'
      } ${(isLoading || hasError) ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={
        isLoading
          ? 'Loading audio...'
          : hasError
          ? 'Error loading audio'
          : isPlaying
          ? 'Pause'
          : 'Play'
      }
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : hasError ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ) : isPlaying ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      )}
    </button>
  );
};

export default PlaybackControls; 