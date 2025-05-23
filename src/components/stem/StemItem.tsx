import React, { memo, useEffect } from 'react';
import { Stem, Track } from '../../types';
import { useStemPlayer } from '../../hooks/useStemPlayer';
import { formatTime } from '../../utils/audio-utils';
import { clearAllStemUrlCaches } from '../../utils/stem-cache';
import { useCart } from '@/contexts/CartContext';
import { toCdnUrl } from '../../utils/cdn-url';

interface StemItemProps {
  stem: Stem;
  track: Track;
  inCart?: boolean;
}

function StemItem({ 
  stem, 
  track, 
  inCart = false 
}: StemItemProps) {
  const { addItem, removeItem, items } = useCart();
  
  const isInCart = items.some(item => item.id === stem.id);
  
  const { 
    isPlaying, 
    isLoading, 
    isLoadingUrl, 
    isError, 
    error, 
    toggle, 
    duration, 
    currentTime, 
    progress,
    reload,
    url
  } = useStemPlayer({ stem, track });

  // Check for track mismatches and log them
  useEffect(() => {
    if (url) {
      const filename = url.split('/').pop()?.toLowerCase() || '';
      const normalizedTrackTitle = track.title.toLowerCase().replace(/[\s-]+/g, '_');
      const trackMatch = filename.includes(normalizedTrackTitle) || 
                          track.title.toLowerCase().split(' ').some(part => 
                            part.length > 3 && filename.includes(part.toLowerCase().replace(/[^a-z0-9]/g, '_'))
                          );
      
      // Special case patterns
      const specialMatch = 
        (track.title.toLowerCase().includes('lo-fi') && filename.includes('lo_fi_beat')) ||
        (track.title.toLowerCase().includes('elevator') && filename.includes('elevator_music')) ||
        (track.title.toLowerCase().includes('crazy meme') && filename.includes('crazy_meme_music')) ||
        (track.title.toLowerCase().includes('dramatic') && filename.includes('dramatic_countdown')) ||
        (track.title.toLowerCase().includes('long opener') && filename.includes('long_opener')) ||
        (track.title.toLowerCase().includes('transition') && filename.includes('transition_music'));
      
      if (!trackMatch && !specialMatch) {
        console.error(`[STEM MISMATCH] ${stem.name} in ${track.title} is using URL for wrong track: ${url}`);
      }
    }
  }, [url, stem.name, track.title]);

  const handleAddToCart = () => {
    addItem({
      id: stem.id,
      name: stem.name,
      trackName: track.title,
      price: stem.price,
      imageUrl: track.imageUrl ? toCdnUrl(track.imageUrl) : '',
      type: 'stem'
    });
  };

  const handleRemoveFromCart = () => {
    removeItem(stem.id);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    reload();
  };
  
  // Handle reset of ALL stem URL caches when persistent track mismatch occurs
  const handleResetAllCaches = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearAllStemUrlCaches();
    console.log('[CACHE] Reset all stem URL caches');
    reload();
  };
  
  // Determine if the play button should be disabled
  const isDisabled = isLoadingUrl || isLoading || isError;
  
  // Calculate formatted time displays
  const currentTimeDisplay = formatTime(currentTime);
  const durationDisplay = formatTime(duration);

  // Get the filename from URL for display
  const getFilenameFromUrl = (url: string | null) => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1] || '';
  };

  // Determine if this URL potentially belongs to the wrong track
  const isPotentiallyWrongTrack = url && !url.toLowerCase().includes(track.title.toLowerCase().replace(/\s+/g, '_')) && 
    !url.toLowerCase().includes(track.title.toLowerCase().replace(/\s+/g, '-'));

  // Check for special track name patterns
  const hasSpecialPattern = url && (
    (track.title.toLowerCase().includes('lo-fi') && url.toLowerCase().includes('lo_fi_beat')) ||
    (track.title.toLowerCase().includes('elevator') && url.toLowerCase().includes('elevator_music')) ||
    (track.title.toLowerCase().includes('crazy meme') && url.toLowerCase().includes('crazy_meme_music')) ||
    (track.title.toLowerCase().includes('dramatic') && url.toLowerCase().includes('dramatic_countdown')) ||
    (track.title.toLowerCase().includes('long opener') && url.toLowerCase().includes('long_opener')) ||
    (track.title.toLowerCase().includes('transition') && url.toLowerCase().includes('transition_music'))
  );

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
          <div className="flex items-center">
            <h3 className="text-lg font-medium">{stem.name}</h3>
            {isLoading && <span className="ml-2 text-yellow-400 text-xs">(Loading...)</span>}
            {!isLoading && !isError && url && <span className="ml-2 text-green-400 text-xs">(Ready)</span>}
            {isPotentiallyWrongTrack && !hasSpecialPattern && (
              <span className="ml-2 text-orange-500 text-xs">(Possible track mismatch)</span>
            )}
          </div>
          
          {isError && (
            <div className="text-red-500 text-sm">
              <p>{error || 'Audio unavailable'}</p>
              {url && (
                <p className="text-xs opacity-70 mt-1">
                  Failed URL: {getFilenameFromUrl(url)}
                  <button 
                    onClick={handleRetry}
                    className="ml-2 px-2 py-0.5 bg-blue-600 rounded text-white hover:bg-blue-700"
                  >
                    Retry
                  </button>
                  <button 
                    onClick={handleResetAllCaches}
                    className="ml-2 px-2 py-0.5 bg-red-600 rounded text-white hover:bg-red-700"
                    title="Reset all cached stem URLs"
                  >
                    Reset Cache
                  </button>
                </p>
              )}
              {!url && (
                <button 
                  onClick={handleRetry}
                  className="mt-1 px-2 py-0.5 bg-blue-600 rounded text-white hover:bg-blue-700"
                >
                  Retry
                </button>
              )}
            </div>
          )}
          
          {/* Track display for verification */}
          <p className="text-xs text-gray-400">Track: {track.title}</p>
          {url && (
            <p className="text-xs text-gray-500 truncate max-w-xs">
              URL: {getFilenameFromUrl(url)}
            </p>
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
        {isInCart ? (
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