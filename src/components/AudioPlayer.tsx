'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import WaveSurfer from 'wavesurfer.js';
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
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isStemsOpen, setIsStemsOpen] = useState(false);
  const [stemAddedToCart, setStemAddedToCart] = useState<Record<string, boolean>>({});
  
  // Group tags by type for display
  const tagsByType = track.tags.reduce<Record<string, Tag[]>>((acc, tag) => {
    const type = tag.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(tag);
    return acc;
  }, {});
  
  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;
    
    // Cleanup previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    try {
      // Create static waveform instead of loading audio initially
      renderStaticWaveform();
      
      // Initialize wavesurfer only when needed (e.g. on play)
      if (isPlaying) {
        const initWaveSurfer = async () => {
          try {
            const WaveSurfer = (await import('wavesurfer.js')).default;
            
            wavesurferRef.current = WaveSurfer.create({
              container: waveformRef.current!,
              waveColor: '#767676',
              progressColor: '#1DF7CE',
              cursorColor: 'transparent',
              barWidth: 2,
              barGap: 1,
              height: 30,
              barRadius: 1,
              normalize: true,
              hideScrollbar: true,
            });
            
            wavesurferRef.current.load(track.audioUrl);
            
            wavesurferRef.current.on('ready', () => {
              if (isPlaying) {
                wavesurferRef.current?.play();
              }
            });
            
            wavesurferRef.current.on('audioprocess', () => {
              setCurrentTime(wavesurferRef.current?.getCurrentTime() || 0);
            });
            
            // Use generic event handler for seek
            (wavesurferRef.current as any).on('seek', () => {
              setCurrentTime(wavesurferRef.current?.getCurrentTime() || 0);
            });
          } catch (error) {
            console.error('Error initializing WaveSurfer:', error);
            // Fallback to static waveform if wavesurfer fails
            renderStaticWaveform();
          }
        };
        
        initWaveSurfer();
      }
    } catch (error) {
      console.error('Error in waveform initialization:', error);
      // Fallback to static waveform if any error occurs
      renderStaticWaveform();
    }
    
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [track.id, isPlaying]);
  
  // Render a static waveform when not playing
  const renderStaticWaveform = () => {
    if (!waveformRef.current) return;
    
    try {
      // Clear previous content
      while (waveformRef.current.firstChild) {
        waveformRef.current.removeChild(waveformRef.current.firstChild);
      }
      
      const container = waveformRef.current;
      const width = container.clientWidth;
      const height = 30;
      const samples = track.waveform || Array(100).fill(0).map(() => Math.random() * 0.8 + 0.2);
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', `${height}px`);
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      
      const barWidth = 2;
      const barGap = 1;
      const numBars = Math.floor(width / (barWidth + barGap));
      const samplesPerBar = Math.ceil(samples.length / numBars);
      
      for (let i = 0; i < numBars; i++) {
        const startSample = i * samplesPerBar;
        const sampleSlice = samples.slice(startSample, startSample + samplesPerBar);
        let sampleValue = 0;
        
        if (sampleSlice.length > 0) {
          sampleValue = sampleSlice.reduce((sum, val) => sum + val, 0) / sampleSlice.length;
        }
        
        const barHeight = Math.max(1, Math.round(sampleValue * height));
        const x = i * (barWidth + barGap);
        const y = (height - barHeight) / 2;
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', `${x}`);
        rect.setAttribute('y', `${y}`);
        rect.setAttribute('width', `${barWidth}`);
        rect.setAttribute('height', `${barHeight}`);
        rect.setAttribute('rx', '1');
        rect.setAttribute('ry', '1');
        rect.setAttribute('fill', '#767676');
        
        svg.appendChild(rect);
      }
      
      container.appendChild(svg);
    } catch (error) {
      console.error('Error rendering static waveform:', error);
    }
  };
  
  // Update play state when isPlaying changes
  useEffect(() => {
    if (isPlaying) {
      wavesurferRef.current?.play();
    } else {
      wavesurferRef.current?.pause();
    }
  }, [isPlaying]);
  
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
            className="text-[#1DF7CE] hover:text-[#19d9b6] transition-colors"
            onClick={() => window.open(track.audioUrl, '_blank')}
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