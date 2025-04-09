'use client';

import React, { useState, useEffect } from 'react';
import { Tag } from '../types';
import SearchBar from './SearchBar';
import Link from 'next/link';
import Image from 'next/image';

interface FilterSidebarProps {
  selectedTags: Tag[];
  genres: Tag[];
  moods: Tag[];
  instruments: Tag[];
  bpmRange: [number, number];
  durationRange: [number, number]; // in seconds
  onTagToggle: (tag: Tag) => void;
  onBpmChange: (range: [number, number]) => void;
  onDurationChange: (range: [number, number]) => void;
  onSearch?: (query: string) => void;
}

export default function FilterSidebar({
  selectedTags,
  genres,
  moods,
  instruments,
  bpmRange,
  durationRange,
  onTagToggle,
  onBpmChange,
  onDurationChange,
  onSearch
}: FilterSidebarProps): React.ReactElement {
  const [genreExpanded, setGenreExpanded] = useState(true);
  const [moodExpanded, setMoodExpanded] = useState(true);
  const [instrumentsExpanded, setInstrumentsExpanded] = useState(true);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [localBpmMin, setLocalBpmMin] = useState<number>(bpmRange[0]);
  const [localBpmMax, setLocalBpmMax] = useState<number>(bpmRange[1]);
  const [localDurationMin, setLocalDurationMin] = useState<number>(durationRange[0]);
  const [localDurationMax, setLocalDurationMax] = useState<number>(durationRange[1]);

  // Group genres by parent
  const genresByParent: Record<string, Tag[]> = {};
  const parentGenres: Tag[] = [];

  genres.forEach(genre => {
    if (genre.parent) {
      if (!genresByParent[genre.parent]) {
        genresByParent[genre.parent] = [];
      }
      genresByParent[genre.parent].push(genre);
    } else {
      parentGenres.push(genre);
    }
  });

  const handleTagClick = (tag: Tag) => {
    onTagToggle(tag);
  };

  const toggleParentExpanded = (parentId: string) => {
    setExpandedParents(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };
  
  const formatDurationForDisplay = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update local values when props change
  useEffect(() => {
    setLocalBpmMin(bpmRange[0]);
    setLocalBpmMax(bpmRange[1]);
    setLocalDurationMin(durationRange[0]);
    setLocalDurationMax(durationRange[1]);
  }, [bpmRange, durationRange]);

  // Add an effect to log when selectedTags change
  useEffect(() => {
    console.log('[DEBUG] FilterSidebar selectedTags updated:', 
      selectedTags.map(tag => `${tag.name}(${tag.id})`));
  }, [selectedTags]);

  const handleBpmMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseInt(e.target.value, 10);
    // Ensure min doesn't exceed max - 10
    const newMin = Math.min(min, localBpmMax - 10);
    setLocalBpmMin(newMin);
    onBpmChange([newMin, localBpmMax]);
  };

  const handleBpmMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value, 10);
    // Ensure max doesn't go below min + 10
    const newMax = Math.max(max, localBpmMin + 10);
    setLocalBpmMax(newMax);
    onBpmChange([localBpmMin, newMax]);
  };

  const handleDurationMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseInt(e.target.value, 10);
    // Ensure min doesn't exceed max - 30
    const newMin = Math.min(min, localDurationMax - 30);
    setLocalDurationMin(newMin);
    onDurationChange([newMin, localDurationMax]);
  };

  const handleDurationMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value, 10);
    // Ensure max doesn't go below min + 30
    const newMax = Math.max(max, localDurationMin + 30);
    setLocalDurationMax(newMax);
    onDurationChange([localDurationMin, newMax]);
  };
  
  const isTagSelected = (tagId: string) => {
    return selectedTags.some(tag => tag.id === tagId);
  };

  return (
    <div className="w-[295px] bg-[#1B1B1B] fixed top-0 left-0 h-screen overflow-y-auto z-0">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center pt-[30px] pb-[32px]">
        <div className="w-[78px] h-[78px] relative">
          <Image 
            src="/wave_cave_logo.png" 
            alt="Wave Cave" 
            width={78} 
            height={78}
            priority
            className="object-contain"
            quality={100}
          />
        </div>
      </Link>

      <div className="px-6 pb-6">
        <SearchBar onSearch={onSearch} />
        
        <div className="mb-6">
          <h3 className="text-[#1DF7CE] font-normal text-sm mb-4">Filters</h3>
        </div>

        {/* Genre Filter */}
        <div className="mb-6">
          <button 
            className="flex w-full items-center justify-between cursor-pointer"
            onClick={() => setGenreExpanded(!genreExpanded)}
            type="button"
          >
            <h3 className="text-white font-normal text-sm mb-2">Genre</h3>
            <span className="text-sm text-gray-400">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform ${genreExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          
          {genreExpanded && (
            <div className="flex flex-wrap gap-1">
              {genres.length > 0 ? genres.map(genre => (
                <button
                  key={genre.id}
                  className={`text-xs font-normal px-3 py-1 rounded-full mr-1 mb-1 flex items-center ${
                    isTagSelected(genre.id) 
                      ? 'bg-[#303030] text-[#1DF7CE] border border-[#1DF7CE]' 
                      : 'bg-[#303030] text-[#CDCDCD] hover:bg-[#474545]'
                  }`}
                  onClick={() => handleTagClick(genre)}
                  type="button"
                >
                  {genre.name}
                  {isTagSelected(genre.id) && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )) : (
                <p className="text-gray-500 text-xs">No genres available</p>
              )}
            </div>
          )}
        </div>

        {/* Mood Filter */}
        <div className="mb-6">
          <button 
            className="flex w-full items-center justify-between cursor-pointer"
            onClick={() => setMoodExpanded(!moodExpanded)}
            type="button"
          >
            <h3 className="text-white font-normal text-sm mb-2">Mood</h3>
            <span className="text-sm text-gray-400">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform ${moodExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          
          {moodExpanded && (
            <div className="flex flex-wrap gap-1">
              {moods.length > 0 ? moods.map(mood => (
                <button
                  key={mood.id}
                  className={`text-xs font-normal px-3 py-1 rounded-full mr-1 mb-1 flex items-center ${
                    isTagSelected(mood.id) 
                      ? 'bg-[#303030] text-[#1DF7CE] border border-[#1DF7CE]' 
                      : 'bg-[#303030] text-[#CDCDCD] hover:bg-[#474545]'
                  }`}
                  onClick={() => handleTagClick(mood)}
                  type="button"
                >
                  {mood.name}
                  {isTagSelected(mood.id) && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )) : (
                <p className="text-gray-500 text-xs">No moods available</p>
              )}
            </div>
          )}
        </div>

        {/* Instruments Filter */}
        <div className="mb-6">
          <button 
            className="flex w-full items-center justify-between cursor-pointer"
            onClick={() => setInstrumentsExpanded(!instrumentsExpanded)}
            type="button"
          >
            <h3 className="text-white font-normal text-sm mb-2">Instruments</h3>
            <span className="text-sm text-gray-400">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform ${instrumentsExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          
          {instrumentsExpanded && (
            <div className="flex flex-wrap gap-1">
              {instruments.length > 0 ? instruments.map(instrument => (
                <button
                  key={instrument.id}
                  className={`text-xs font-normal px-3 py-1 rounded-full mr-1 mb-1 flex items-center ${
                    isTagSelected(instrument.id) 
                      ? 'bg-[#303030] text-[#1DF7CE] border border-[#1DF7CE]' 
                      : 'bg-[#303030] text-[#CDCDCD] hover:bg-[#474545]'
                  }`}
                  onClick={() => handleTagClick(instrument)}
                  type="button"
                >
                  {instrument.name}
                  {isTagSelected(instrument.id) && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )) : (
                <p className="text-gray-500 text-xs">No instruments available</p>
              )}
            </div>
          )}
        </div>

        {/* BPM Range Slider */}
        <div className="mb-8">
          <h3 className="text-white text-sm mb-1">BPM Range</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm">{localBpmMin}</span>
            <span className="text-white text-sm">{localBpmMax === 200 ? "200+" : localBpmMax}</span>
          </div>
          
          <div className="relative h-0.5 pt-3 pb-3 mt-3">
            {/* Background track */}
            <div className="absolute w-full h-0.5 bg-[#2C2C2C] top-1/2 transform -translate-y-1/2"></div>
            
            {/* Colored range track */}
            <div 
              className="absolute h-0.5 bg-[#1DF7CE]"
              style={{ 
                left: `${(localBpmMin / 200) * 100}%`,
                width: `${((localBpmMax - localBpmMin) / 200) * 100}%`,
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            ></div>

            {/* Min and Max handle inputs - separated to prevent conflicts */}
            <div 
              className="absolute w-full h-full left-0 top-0 cursor-pointer"
              onMouseDown={(e) => {
                // Get slider bounds
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const sliderWidth = rect.width;
                
                // Calculate position as percentage
                const posPercent = Math.max(0, Math.min(100, (offsetX / sliderWidth) * 100));
                const posValue = Math.round((posPercent / 100) * 200);
                
                // Determine which handle to move based on proximity
                const distToMin = Math.abs(posValue - localBpmMin);
                const distToMax = Math.abs(posValue - localBpmMax);
                
                // Select the closest handle to move
                const moveMin = distToMin <= distToMax;
                
                // Set initial value
                if (moveMin) {
                  const newMin = Math.min(posValue, localBpmMax - 10);
                  setLocalBpmMin(newMin);
                  onBpmChange([newMin, localBpmMax]);
                } else {
                  const newMax = Math.max(posValue, localBpmMin + 10);
                  setLocalBpmMax(newMax);
                  onBpmChange([localBpmMin, newMax]);
                }
                
                // Track which handle is being moved
                const handleMove = (moveEvent: MouseEvent) => {
                  const newOffsetX = moveEvent.clientX - rect.left;
                  const newPercent = Math.max(0, Math.min(100, (newOffsetX / sliderWidth) * 100));
                  const newValue = Math.round((newPercent / 100) * 200);
                  
                  if (moveMin) {
                    const newMin = Math.min(newValue, localBpmMax - 10);
                    setLocalBpmMin(newMin);
                    onBpmChange([newMin, localBpmMax]);
                  } else {
                    const newMax = Math.max(newValue, localBpmMin + 10);
                    setLocalBpmMax(newMax);
                    onBpmChange([localBpmMin, newMax]);
                  }
                };
                
                // Clean up function
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                // Add move and up listeners
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
            </div>
            
            {/* Left visual handle */}
            <div 
              className="absolute w-4 h-4 rounded-full bg-[#1DF7CE] border border-gray-700"
              style={{ 
                left: `${(localBpmMin / 200) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 20
              }}
            ></div>
            
            {/* Right visual handle */}
            <div 
              className="absolute w-4 h-4 rounded-full bg-[#1DF7CE] border border-gray-700"
              style={{ 
                left: `${(localBpmMax / 200) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 20
              }}
            ></div>
          </div>
        </div>

        {/* Duration Range Slider */}
        <div className="mb-8">
          <h3 className="text-white text-sm mb-1">Duration</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-white text-sm">{formatDurationForDisplay(localDurationMin)}</span>
            <span className="text-white text-sm">{localDurationMax === 600 ? "10:00+" : formatDurationForDisplay(localDurationMax)}</span>
          </div>
          
          <div className="relative h-0.5 pt-3 pb-3 mt-3">
            {/* Background track */}
            <div className="absolute w-full h-0.5 bg-[#2C2C2C] top-1/2 transform -translate-y-1/2"></div>
            
            {/* Colored range track */}
            <div 
              className="absolute h-0.5 bg-[#1DF7CE]"
              style={{ 
                left: `${(localDurationMin / 600) * 100}%`,
                width: `${((localDurationMax - localDurationMin) / 600) * 100}%`,
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            ></div>

            {/* Min and Max handle inputs - separated to prevent conflicts */}
            <div 
              className="absolute w-full h-full left-0 top-0 cursor-pointer"
              onMouseDown={(e) => {
                // Get slider bounds
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const sliderWidth = rect.width;
                
                // Calculate position as percentage
                const posPercent = Math.max(0, Math.min(100, (offsetX / sliderWidth) * 100));
                const posValue = Math.round((posPercent / 100) * 600);
                
                // Determine which handle to move based on proximity
                const distToMin = Math.abs(posValue - localDurationMin);
                const distToMax = Math.abs(posValue - localDurationMax);
                
                // Select the closest handle to move
                const moveMin = distToMin <= distToMax;
                
                // Set initial value
                if (moveMin) {
                  const newMin = Math.min(posValue, localDurationMax - 30);
                  setLocalDurationMin(newMin);
                  onDurationChange([newMin, localDurationMax]);
                } else {
                  const newMax = Math.max(posValue, localDurationMin + 30);
                  setLocalDurationMax(newMax);
                  onDurationChange([localDurationMin, newMax]);
                }
                
                // Track which handle is being moved
                const handleMove = (moveEvent: MouseEvent) => {
                  const newOffsetX = moveEvent.clientX - rect.left;
                  const newPercent = Math.max(0, Math.min(100, (newOffsetX / sliderWidth) * 100));
                  const newValue = Math.round((newPercent / 100) * 600);
                  
                  if (moveMin) {
                    const newMin = Math.min(newValue, localDurationMax - 30);
                    setLocalDurationMin(newMin);
                    onDurationChange([newMin, localDurationMax]);
                  } else {
                    const newMax = Math.max(newValue, localDurationMin + 30);
                    setLocalDurationMax(newMax);
                    onDurationChange([localDurationMin, newMax]);
                  }
                };
                
                // Clean up function
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                // Add move and up listeners
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
            </div>
            
            {/* Left visual handle */}
            <div 
              className="absolute w-4 h-4 rounded-full bg-[#1DF7CE] border border-gray-700"
              style={{ 
                left: `${(localDurationMin / 600) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 20
              }}
            ></div>
            
            {/* Right visual handle */}
            <div 
              className="absolute w-4 h-4 rounded-full bg-[#1DF7CE] border border-gray-700"
              style={{ 
                left: `${(localDurationMax / 600) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 20
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
} 