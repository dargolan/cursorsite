import React from 'react';

interface PlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string;
  className?: string;
}

export default function PlayButton({
  isPlaying,
  onClick,
  isLoading = false,
  size = 'md',
  accentColor = '#1DF7CE',
  className = '',
}: PlayButtonProps) {
  // Size mappings
  const sizeMap = {
    sm: {
      button: 'w-8 h-8',
      icon: 'w-3 h-3',
    },
    md: {
      button: 'w-10 h-10',
      icon: 'w-4 h-4',
    },
    lg: {
      button: 'w-12 h-12',
      icon: 'w-5 h-5',
    },
  };
  
  const buttonClasses = sizeMap[size].button;
  const iconClasses = sizeMap[size].icon;
  
  return (
    <button
      type="button"
      className={`rounded-full flex items-center justify-center bg-[#282828] hover:bg-[#333] transition-colors focus:outline-none focus:ring-2 focus:ring-${accentColor.replace('#', '')} ${buttonClasses} ${className}`}
      onClick={onClick}
      disabled={isLoading}
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {isLoading ? (
        <div className={`border-2 border-gray-600 border-t-${accentColor.replace('#', '')} rounded-full animate-spin ${iconClasses}`}></div>
      ) : isPlaying ? (
        // Pause icon
        <svg 
          className={iconClasses} 
          fill="none" 
          stroke={accentColor} 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 9v6m4-6v6"
          />
        </svg>
      ) : (
        // Play icon
        <svg 
          className={`${iconClasses} ml-0.5`} 
          fill="none" 
          stroke={accentColor} 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
          />
        </svg>
      )}
    </button>
  );
} 