'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import WaveSurfer from 'wavesurfer.js';
import { Tag, Stem, Track, CartItem } from '../types';

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlayPause: (trackId: string) => void;
  onAddToCart: (item: CartItem) => void;
  onTagClick: (tag: Tag) => void;
}

export default function AudioPlayer({ 
  track, 
  isPlaying,
  onPlayPause,
  onAddToCart,
  onTagClick
}: AudioPlayerProps): React.ReactElement {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isStemsOpen, setIsStemsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [stemAddedToCart, setStemAddedToCart] = useState<Record<string, boolean>>({});
  
  // Format track's tags for display
  const tagsByType = track.tags.reduce((acc: Record<string, Tag[]>, tag) => {
    if (!tag || !tag.type) return acc; // Skip undefined tags or tags without type
    if (!acc[tag.type]) acc[tag.type] = [];
    acc[tag.type].push(tag);
    return acc;
  }, {});
  
  const formattedGenreTags = tagsByType['genre']?.map(tag => tag.name).join(', ');
  const formattedOtherTags = [...(tagsByType['mood'] || []), ...(tagsByType['instrument'] || [])]
    .map(tag => tag.name).join(', ');

  // Initialize wavesurfer
  useEffect(() => {
    if (waveformRef.current) {
      // Destroy previous instance
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      try {
        // Create WaveSurfer instance with static waveform
        renderStaticWaveform();
        
        // Keep reference even though we're using static waveform
        wavesurferRef.current = {
          getCurrentTime: () => currentTime,
          destroy: () => {
            if (waveformRef.current) {
              waveformRef.current.innerHTML = '';
            }
          }
        } as any;
      } catch (error) {
        console.error("Error initializing waveform:", error);
        renderStaticWaveform();
      }

      // Cleanup
      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }
      };
    }
  }, [track.id]); // Only recreate when track changes

  // Render a static waveform that's stable
  const renderStaticWaveform = () => {
    if (!waveformRef.current) return;
    
    const container = waveformRef.current;
    container.innerHTML = '';
    
    // Create a progress and background element
    const waveformBackground = document.createElement('div');
    waveformBackground.style.width = '100%';
    waveformBackground.style.height = '40px';
    waveformBackground.style.background = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%\' height=\'100%\' viewBox=\'0 0 100 100\'><path d=\'M 0,50 Q 10,30 20,50 T 40,50 T 60,50 T 80,50 T 100,50\' stroke=\'%23767676\' fill=\'none\' stroke-width=\'1\'/></svg>") repeat-x';
    waveformBackground.style.backgroundSize = 'auto 100%';
    
    const waveformProgress = document.createElement('div');
    waveformProgress.style.width = `${(currentTime / track.duration) * 100}%`;
    waveformProgress.style.height = '40px';
    waveformProgress.style.position = 'absolute';
    waveformProgress.style.left = '0';
    waveformProgress.style.top = '0';
    waveformProgress.style.background = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100%\' height=\'100%\' viewBox=\'0 0 100 100\'><path d=\'M 0,50 Q 10,30 20,50 T 40,50 T 60,50 T 80,50 T 100,50\' stroke=\'white\' fill=\'none\' stroke-width=\'1\'/></svg>") repeat-x';
    waveformProgress.style.backgroundSize = 'auto 100%';
    waveformProgress.style.zIndex = '1';
    waveformProgress.style.pointerEvents = 'none';
    
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '40px';
    container.style.overflow = 'hidden';
    
    container.appendChild(waveformBackground);
    container.appendChild(waveformProgress);
  };
  
  // Update waveform playback progress
  useEffect(() => {
    renderStaticWaveform();
  }, [currentTime, isPlaying]);
  
  // Limit the number of tags displayed per type
  const limitedTags = React.useMemo(() => {
    const limited: Record<string, Tag[]> = {};
    
    // For each tag type, limit to max 2 tags
    Object.entries(tagsByType).forEach(([type, tags]) => {
      limited[type] = tags.slice(0, 1); // Show only 1 tag per type
    });
    
    return limited;
  }, [tagsByType]);

  // Control playback state
  useEffect(() => {
    if (wavesurferRef.current) {
      try {
        if (isPlaying) {
          wavesurferRef.current.play();
        } else {
          wavesurferRef.current.pause();
        }
      } catch (error) {
        console.error("Error controlling playback:", error);
      }
    }
  }, [isPlaying]);

  // Ensure waveform container has fixed dimensions to prevent layout shifts
  useEffect(() => {
    if (waveformRef.current) {
      waveformRef.current.style.height = '40px';
      waveformRef.current.style.width = '100%';
      waveformRef.current.style.minWidth = '100px';
    }
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    onPlayPause(track.id);
  };

  const handleStemPlayPause = (stemId: string) => {
    // Stem playback logic would go here
  };

  const handleStemAddToCart = (stem: Stem) => {
    onAddToCart({ id: stem.id, type: 'stem', price: stem.price });
    setStemAddedToCart(prev => ({ ...prev, [stem.id]: true }));
  };

  const handleDownloadAllStems = () => {
    if (!track.stems) return;
    
    // Calculate total price and discounted price
    const totalPrice = track.stems.reduce((sum, stem) => sum + stem.price, 0);
    const discountedPrice = Math.floor(totalPrice * 0.75 * 100) / 100;
    
    // Add all stems to cart with discounted price
    onAddToCart({ id: `${track.id}-all-stems`, type: 'stem', price: discountedPrice });
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
        
        {/* Waveform - using all remaining space */}
        <div className="flex-1 ml-2 mr-4">
          <div 
            ref={waveformRef} 
            className="cursor-pointer w-full" 
            style={{ height: '30px' }}
          />
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
            onClick={() => onAddToCart({ id: track.id, type: 'track', price: 0 })}
            className="text-[#1DF7CE] hover:text-[#19d9b6] transition-colors"
          >
            <span className="material-symbols-rounded" style={{ fontSize: '20px' }}>
              download
            </span>
          </button>
        </div>
      </div>
      
      {/* Stems dropdown */}
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
                
                <div className="flex-grow h-8 bg-[#767676] rounded mx-2">
                  {/* Simplified waveform representation */}
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
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    )}
                  </button>
                  <span className="text-[#1DF7CE] text-xs font-normal mt-1">${stem.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={handleDownloadAllStems}
              className="bg-[#1DF7CE] hover:bg-[#19d9b6] text-[#1E1E1E] font-normal px-4 py-2 rounded transition-colors"
            >
              Download All Stems (${discountedStemsPrice.toFixed(2)})
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 