'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Tag, Stem, Track, CartItem } from '../types';

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onAddToCart: (stem: Stem, track: Track) => void;
  onTagClick: (tag: Tag) => void;
}

export default function AudioPlayer({ 
  track, 
  isPlaying,
  onPlay,
  onStop,
  onAddToCart,
  onTagClick
}: AudioPlayerProps): React.ReactElement {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isStemsOpen, setIsStemsOpen] = useState(false);
  const [stemAddedToCart, setStemAddedToCart] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  
  // Group tags by type for display
  const tagsByType = track.tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const type = tag.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(tag);
    return acc;
  }, {});
  
  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(track.audioUrl);
      
      // Add event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleAudioEnded);
    } else {
      audioRef.current.src = track.audioUrl;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [track.id]);
  
  // Handle time updates from audio element
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || track.duration;
      setCurrentTime(current);
      setProgress((current / duration) * 100);
    }
  };
  
  // Handle audio ending
  const handleAudioEnded = () => {
    setCurrentTime(0);
    setProgress(0);
    onStop();
  };
  
  // Update play state when isPlaying changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          onStop();
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, onStop]);
  
  // Handle click on progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentageClicked = clickX / rect.width;
    
    // Set new time based on click position
    const newTime = percentageClicked * (audioRef.current.duration || track.duration);
    setCurrentTime(newTime);
    setProgress(percentageClicked * 100);
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    
    // Start playing if needed
    if (!isPlaying) {
      onPlay();
    }
  };
  
  // Format time for display (mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handlePlayPause = () => {
    if (isPlaying) {
      onStop();
    } else {
      onPlay();
    }
  };
  
  const handleStemPlayPause = (stemId: string) => {
    // This would play individual stems in a real implementation
    console.log('Play/pause stem:', stemId);
  };
  
  const handleStemAddToCart = (stem: Stem) => {
    setStemAddedToCart(prev => ({ ...prev, [stem.id]: true }));
    onAddToCart(stem, track);
  };
  
  const handleDownloadAllStems = () => {
    if (!track.stems) return;
    
    track.stems.forEach(stem => {
      if (!stemAddedToCart[stem.id]) {
        setStemAddedToCart(prev => ({ ...prev, [stem.id]: true }));
        onAddToCart(stem, track);
      }
    });
  };

  // Calculate total stems price
  const totalStemsPrice = track.stems?.reduce((sum, stem) => sum + stem.price, 0) || 0;
  const discountedStemsPrice = Math.floor(totalStemsPrice * 0.75 * 100) / 100;

  return (
    <div 
      className={`relative mx-[30px] border-b border-[#1A1A1A] ${isHovering ? 'bg-[#232323]' : 'bg-[#1E1E1E]'}`}
      style={{ marginBottom: "-1px" }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div 
        className="flex items-center px-4 py-[2px] rounded"
        style={{ minHeight: '70px' }}
      >
        {/* Track image with fixed width */}
        <div className="w-12 h-12 rounded overflow-hidden relative mr-4 flex-shrink-0">
          <div 
            className={`absolute inset-0 bg-black ${isHovering || isPlaying ? 'opacity-50' : 'opacity-0'} transition-opacity z-10`}
          />
          <Image 
            src={track.imageUrl} 
            alt={track.title}
            width={48}
            height={48}
            className="object-cover"
            onError={(e) => {
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M9 18V5l12-2v13'%3E%3C/path%3E%3Ccircle cx='6' cy='18' r='3'%3E%3C/circle%3E%3Ccircle cx='18' cy='16' r='3'%3E%3C/circle%3E%3C/svg%3E";
            }}
          />
          <button 
            onClick={handlePlayPause}
            className={`absolute inset-0 flex items-center justify-center z-20 ${isHovering || isPlaying ? 'opacity-100' : 'opacity-0'} transition-opacity`}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
        
        {/* Title and BPM area - fixed width */}
        <div className="w-32 mr-6 flex-shrink-0">
          <h3 className="font-bold text-[15px] text-white truncate">{track.title}</h3>
          <div className="flex items-baseline">
            <span className="text-[12.5px] font-normal text-[#999999]">{track.bpm} BPM</span>
          </div>
        </div>
        
        {/* Tags area - fixed width */}
        <div className="w-56 mr-4 flex-shrink-0">
          <div className="text-[12.5px] font-normal text-[#999999] overflow-hidden line-clamp-2">
            {Object.entries(tagsByType).flatMap(([type, tags], typeIndex, array) => (
              tags.map((tag, tagIndex, tagArray) => (
                <React.Fragment key={tag.id}>
                  <button 
                    onClick={() => onTagClick(tag)}
                    className="hover:text-[#1DF7CE] transition-colors inline"
                  >
                    {tag.name}
                  </button>
                  {tagIndex < tagArray.length - 1 && <span>, </span>}
                  {typeIndex < array.length - 1 && tagIndex === tagArray.length - 1 && <span>, </span>}
                </React.Fragment>
              ))
            ))}
          </div>
        </div>
        
        {/* Progress bar - using all remaining space */}
        <div className="flex-1 ml-2 mr-4">
          <div 
            ref={progressBarRef}
            onClick={handleProgressBarClick}
            className="cursor-pointer w-full relative bg-[#3A3A3A] rounded-full"
            style={{ height: '6px', marginTop: '12px', marginBottom: '12px' }}
          >
            {/* Progress indicator */}
            <div 
              className="absolute top-0 left-0 h-full bg-[#1DF7CE] rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Duration - fixed width */}
        <div className="w-24 text-[12.5px] font-normal text-[#999999] whitespace-nowrap mr-4 flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(track.duration)}
        </div>
        
        {/* Action buttons - fixed width */}
        <div className="w-36 flex items-center justify-end space-x-3 flex-shrink-0">
          {track.hasStems && (
            <button 
              onClick={() => setIsStemsOpen(!isStemsOpen)}
              className="text-white hover:text-[#1DF7CE] transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
                clear_all
              </span>
            </button>
          )}
          
          <button className="text-white hover:text-[#1DF7CE] transition-colors">
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
              fiber_smart_record
            </span>
          </button>
          
          <button className="text-white hover:text-[#1DF7CE] transition-colors">
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
              favorite
            </span>
          </button>
          
          <button 
            className="text-[#1DF7CE] hover:text-[#19d9b6] transition-colors"
            onClick={() => window.open(track.audioUrl, '_blank')}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
              download
            </span>
          </button>
        </div>
      </div>
      
      {/* Stems dropdown - modify this if needed */}
      {isStemsOpen && track.stems && (
        <div className="bg-[#252525] rounded-b p-4 pt-2">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[#1DF7CE] font-bold text-[15px]">Stems</h4>
            <button 
              onClick={() => setIsStemsOpen(false)}
              className="text-white hover:text-[#1DF7CE]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {track.stems.map(stem => (
              <div 
                key={stem.id} 
                className="border border-[#3C3C3C] rounded p-3 flex items-center"
              >
                <div className="w-24 mr-3">
                  <p className="font-bold text-xs text-white truncate">{stem.name}</p>
                </div>
                
                <button 
                  onClick={() => handleStemPlayPause(stem.id)}
                  className="w-8 h-8 flex items-center justify-center text-white mr-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>
                
                {/* Simple progress bar for stems */}
                <div className="flex-grow h-4 bg-[#3A3A3A] rounded mx-2">
                  {/* Simplified progress representation */}
                </div>
                
                <div className="w-16 text-white text-xs font-normal text-right mr-3">
                  {formatTime(stem.duration)}
                </div>
                
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => handleStemAddToCart(stem)}
                    disabled={stemAddedToCart[stem.id]}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      stemAddedToCart[stem.id] 
                        ? 'bg-[#19d9b6] text-[#1E1E1E]' 
                        : 'bg-[#1DF7CE] hover:bg-[#19d9b6] text-[#1E1E1E]'
                    } transition-colors`}
                  >
                    {stemAddedToCart[stem.id] ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12l2 2 4-4" />
                        <path d="M17 9v6h3" />
                      </svg>
                    )}
                  </button>
                  <span className="mt-1 text-xs text-[#999999]">${stem.price}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Buy all stems button */}
          <div className="flex justify-between items-center mt-4">
            <div>
              <p className="text-xs text-[#999999]">Buy all stems:</p>
              <p className="text-[#1DF7CE] font-bold">${discountedStemsPrice} <span className="line-through text-[#999999] text-xs font-normal">${totalStemsPrice}</span></p>
            </div>
            <button 
              onClick={handleDownloadAllStems}
              className="bg-[#1DF7CE] hover:bg-[#19d9b6] text-[#1E1E1E] px-4 py-2 rounded text-sm font-bold transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 