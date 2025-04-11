'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '../../contexts/CartContext';
import { Tag, Stem } from '../../types';
import { AudioPlayerProps } from './types';
import { ProgressBar } from './ProgressBar';
import { AudioControls } from './AudioControls';
import { StemPlayer } from './StemPlayer';
import { Toast } from './Toast';
import { globalAudioManager } from './globalAudioManager';

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  isPlaying,
  onPlay,
  onStop,
  onTagClick,
  openStemsTrackId,
  setOpenStemsTrackId
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { addItem, removeItem } = useCart();
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [stemAddedToCart, setStemAddedToCart] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [playingStems, setPlayingStems] = useState<Record<string, boolean>>({});
  const [stemProgress, setStemProgress] = useState<Record<string, number>>({});
  const [stemLoadErrors, setStemLoadErrors] = useState<Record<string, boolean>>({});
  const [mainAudioError, setMainAudioError] = useState(false);
  const [stemLoading, setStemLoading] = useState<Record<string, boolean>>({});
  const [showToast, setShowToast] = useState<{stemId: string, stemName: string, price: number, action: 'add' | 'remove'} | null>(null);
  const [isBuyingAll, setIsBuyingAll] = useState(false);
  const [priceAnimating, setPriceAnimating] = useState(false);

  // Determine if stems should be open for this track
  const isStemsOpen = openStemsTrackId === track.id;

  // Group tags by type for display
  const tagsByType = track.tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const tagTypeLower = tag.type.toLowerCase();
    if (tagTypeLower === 'genre' || tagTypeLower === 'mood') {
      if (!acc[tag.type]) acc[tag.type] = [];
      acc[tag.type].push(tag);
    }
    return acc;
  }, {});

  // Calculate total and discounted prices
  const totalStemsPrice = track.stems?.reduce((sum, stem) => sum + stem.price, 0) || 0;
  const discountedStemsPrice = Math.floor(totalStemsPrice * 0.75 * 100) / 100;
  const allStemsInCart = track.stems?.every(stem => stemAddedToCart[stem.id]) || false;

  // Handle audio playback
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(track.audioUrl);
      audioRef.current.addEventListener('timeupdate', () => {
        const current = audioRef.current?.currentTime || 0;
        setCurrentTime(current);
        setProgress((current / track.duration) * 100);
      });
      audioRef.current.addEventListener('ended', () => {
        setCurrentTime(0);
        setProgress(0);
        onStop();
      });
      audioRef.current.addEventListener('error', () => {
        setMainAudioError(true);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [track.audioUrl, track.duration, onStop]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && !mainAudioError) {
        audioRef.current.play().catch(() => {
          setMainAudioError(true);
          onStop();
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, mainAudioError, onStop]);

  const handlePlayPause = () => {
    if (isPlaying) {
      onStop();
      globalAudioManager.stop();
      setIsInteracting(false);
    } else {
      if (audioRef.current) {
        globalAudioManager.play(audioRef.current, { trackId: track.id });
      }
      onPlay();
      setIsInteracting(true);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(track.audioUrl);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `${track.title}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error('Error downloading track:', error);
    }
  };

  const handleStemAddToCart = (stem: Stem) => {
    setShowToast({
      stemId: stem.id,
      stemName: stem.name,
      price: stem.price,
      action: 'add'
    });
    setTimeout(() => setShowToast(null), 4000);
    
    setStemAddedToCart(prev => ({ ...prev, [stem.id]: true }));
    addItem({
      id: stem.id,
      name: stem.name,
      trackName: track.title,
      price: stem.price,
      imageUrl: track.imageUrl,
      type: 'stem'
    });
  };

  const handleStemRemoveFromCart = (stem: Stem) => {
    setShowToast({
      stemId: stem.id,
      stemName: stem.name,
      price: stem.price,
      action: 'remove'
    });
    setTimeout(() => setShowToast(null), 4000);
    
    setStemAddedToCart(prev => ({ ...prev, [stem.id]: false }));
    removeItem(stem.id);
  };

  const handleBuyAllStems = () => {
    if (!track.stems || track.stems.length === 0 || isBuyingAll) return;
    
    setIsBuyingAll(true);
    setTimeout(() => {
      track.stems?.forEach(stem => {
        if (!stemAddedToCart[stem.id]) {
          handleStemAddToCart(stem);
        }
      });
      setIsBuyingAll(false);
      setPriceAnimating(true);
      setTimeout(() => setPriceAnimating(false), 800);
    }, 800);
  };

  return (
    <div 
      className={`relative border-b border-[#1A1A1A] ${isHovering || isInteracting || isStemsOpen ? 'bg-[#232323]' : 'bg-[#121212]'}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main track section */}
      <div className="flex items-center w-full px-4 py-[6px]" style={{ minHeight: '84px' }}>
        {/* Track image and info */}
        <div className="flex items-center w-[384px] flex-shrink-0">
          <div className="w-14 h-14 rounded overflow-hidden relative mr-4 flex-shrink-0">
            <Image 
              src={track.imageUrl} 
              alt={track.title}
              width={56}
              height={56}
              className="object-cover w-14 h-14"
            />
            <AudioControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onDownload={handleDownload}
              hasError={mainAudioError}
            />
          </div>

          <div className="w-32 mr-6 flex-shrink-0">
            <h3 className="font-bold text-[15px] text-white break-words leading-tight mb-0 line-clamp-2">
              {track.title}
            </h3>
            <span className="text-[12.5px] font-normal text-[#999999] block">
              {track.bpm} BPM
            </span>
          </div>

          <div className="w-52 mr-8 flex-shrink-0">
            <div className="text-[12.5px] font-normal text-[#999999] overflow-hidden line-clamp-2">
              {Object.entries(tagsByType).map(([type, tags], typeIndex, array) => (
                tags.map((tag, tagIndex) => (
                  <React.Fragment key={tag.id}>
                    <button 
                      onClick={() => onTagClick(tag)}
                      className="hover:text-[#1DF7CE] transition-colors inline"
                    >
                      {tag.name}
                    </button>
                    {tagIndex < tags.length - 1 && <span>, </span>}
                    {typeIndex < array.length - 1 && tagIndex === tags.length - 1 && <span>, </span>}
                  </React.Fragment>
                ))
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar and controls */}
        <div className="flex items-center justify-between flex-grow pl-24">
          <div className="w-[calc(100%-240px)] min-w-[200px]">
            <ProgressBar
              progress={progress}
              duration={track.duration}
              currentTime={currentTime}
              onProgressChange={(percentage: number) => {
                const newTime = percentage * track.duration;
                if (audioRef.current) {
                  audioRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                  setProgress(percentage * 100);
                }
              }}
            />
          </div>

          {/* Stems button */}
          <div className="flex items-center space-x-3 flex-shrink-0 min-w-[110px]">
            <div className="w-[68px] flex justify-end">
              {track.hasStems && (
                <button 
                  onClick={() => setOpenStemsTrackId(isStemsOpen ? null : track.id)}
                  className="text-white hover:text-[#1DF7CE] px-3 py-1 text-sm flex items-center transition-colors"
                >
                  <span>Stems</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points={isStemsOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stems section */}
      {isStemsOpen && track.stems && (
        <div className="bg-[#232323] rounded-b p-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            {track.stems.map(stem => (
              <StemPlayer
                key={stem.id}
                stem={stem}
                trackTitle={track.title}
                isPlaying={playingStems[stem.id]}
                progress={stemProgress[stem.id] || 0}
                onPlayPause={() => {
                  const newIsPlaying = !playingStems[stem.id];
                  setPlayingStems(prev => ({ ...prev, [stem.id]: newIsPlaying }));
                }}
                onProgressChange={(percentage) => {
                  setStemProgress(prev => ({ ...prev, [stem.id]: percentage * 100 }));
                }}
                isInCart={stemAddedToCart[stem.id]}
                onAddToCart={() => handleStemAddToCart(stem)}
                onRemoveFromCart={() => handleStemRemoveFromCart(stem)}
                hasError={stemLoadErrors[stem.id]}
                isLoading={stemLoading[stem.id]}
              />
            ))}
          </div>

          {/* Buy all stems button */}
          <div className="flex justify-end items-center mt-4">
            <div className="flex items-center">
              <div className="mr-3 text-right relative">
                <div className="flex items-center">
                  <span className="text-sm text-[#999999] line-through mr-2">€{totalStemsPrice}</span>
                  <span className="text-sm text-[#1DF7CE] font-bold">€{discountedStemsPrice}</span>
                </div>
                {priceAnimating && (
                  <span className="absolute text-sm text-[#1DF7CE] font-bold animate-fly-to-cart">
                    €{discountedStemsPrice}
                  </span>
                )}
              </div>

              <button
                onClick={handleBuyAllStems}
                disabled={isBuyingAll || allStemsInCart}
                className="bg-[#1DF7CE] hover:bg-[#19d9b6] text-[#1E1E1E] px-4 py-2 rounded-full font-medium transition-colors flex items-center justify-center whitespace-nowrap w-[140px] h-[36px]"
              >
                {isBuyingAll ? (
                  <span className="flex justify-center items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-[#1E1E1E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#1E1E1E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-[#1E1E1E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                ) : allStemsInCart ? (
                  <span className="font-medium text-sm">Added to Cart</span>
                ) : (
                  <span className="font-medium text-sm">Buy All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {showToast && (
        <Toast
          message={`${showToast.stemName} ${showToast.action === 'add' ? 'added to' : 'removed from'} cart • €${showToast.price}`}
          type={showToast.action === 'add' ? 'success' : 'error'}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
}; 