'use client';

import React, { useState, useEffect } from 'react';
import { Tag } from '../types';

interface FilterSidebarProps {
  onSearchChange: (query: string) => void;
  onTagSelect: (tag: Tag) => void;
  onTagDeselect: (tagId: string) => void;
  onBpmRangeChange: (min: number, max: number) => void;
  onDurationRangeChange: (min: number, max: number) => void;
  selectedTags: Tag[];
  genres: Tag[];
  moods: Tag[];
  instruments: Tag[];
  bpmRange: [number, number];
  durationRange: [number, number]; // in seconds
}

export default function FilterSidebar({
  onSearchChange,
  onTagSelect,
  onTagDeselect,
  onBpmRangeChange,
  onDurationRangeChange,
  selectedTags,
  genres,
  moods,
  instruments,
  bpmRange,
  durationRange
}: FilterSidebarProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
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
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      onTagDeselect(tag.id);
    } else {
      onTagSelect(tag);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
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

  const handleBpmMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseInt(e.target.value, 10);
    // Ensure min doesn't exceed max - 10
    const newMin = Math.min(min, localBpmMax - 10);
    setLocalBpmMin(newMin);
    onBpmRangeChange(newMin, localBpmMax);
  };

  const handleBpmMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value, 10);
    // Ensure max doesn't go below min + 10
    const newMax = Math.max(max, localBpmMin + 10);
    setLocalBpmMax(newMax);
    onBpmRangeChange(localBpmMin, newMax);
  };

  const handleDurationMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = parseInt(e.target.value, 10);
    // Ensure min doesn't exceed max - 30
    const newMin = Math.min(min, localDurationMax - 30);
    setLocalDurationMin(newMin);
    onDurationRangeChange(newMin, localDurationMax);
  };

  const handleDurationMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = parseInt(e.target.value, 10);
    // Ensure max doesn't go below min + 30
    const newMax = Math.max(max, localDurationMin + 30);
    setLocalDurationMax(newMax);
    onDurationRangeChange(localDurationMin, newMax);
  };
  
  const isTagSelected = (tagId: string) => {
    return selectedTags.some(tag => tag.id === tagId);
  };

  return (
    <div 
      className="w-64 bg-[#1B1B1B] min-h-screen p-4 border-r border-gray-800 sticky top-0 left-0 h-screen overflow-y-auto"
      style={{ minWidth: '250px', maxWidth: '300px' }}
    >
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#CDCDCD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search Tracks..." 
            value={searchQuery}
            onChange={handleSearch}
            className="w-full p-2 pl-10 rounded-full bg-transparent border border-[#CDCDCD] text-white placeholder-[#CDCDCD] text-xs font-normal"
          />
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-[#1DF7CE] font-normal text-xs mb-2">Filters</h3>
      </div>

      {/* Genre Filter */}
      <div className="mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setGenreExpanded(!genreExpanded)}
        >
          <h3 className="text-white font-normal text-xs mb-2">Genre</h3>
          <button className="text-sm text-gray-400">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform ${genreExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {genreExpanded && (
          <div className="flex flex-wrap gap-1">
            {genres.map(genre => (
              <button
                key={genre.id}
                className={`text-xs font-normal px-3 py-1 rounded-full mr-1 mb-1 flex items-center ${
                  isTagSelected(genre.id) 
                    ? 'bg-[#303030] text-[#1DF7CE]' 
                    : 'bg-[#303030] text-[#CDCDCD] hover:bg-[#474545]'
                }`}
                onClick={() => handleTagClick(genre)}
              >
                {genre.name}
                {isTagSelected(genre.id) && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mood Filter */}
      <div className="mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setMoodExpanded(!moodExpanded)}
        >
          <h3 className="text-white font-normal text-xs mb-2">Mood</h3>
          <button className="text-sm text-gray-400">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform ${moodExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {moodExpanded && (
          <div className="flex flex-wrap gap-1">
            {moods.map(mood => (
              <button
                key={mood.id}
                className={`text-xs font-normal px-3 py-1 rounded-full mr-1 mb-1 flex items-center ${
                  isTagSelected(mood.id) 
                    ? 'bg-[#303030] text-[#1DF7CE]' 
                    : 'bg-[#303030] text-[#CDCDCD] hover:bg-[#474545]'
                }`}
                onClick={() => handleTagClick(mood)}
              >
                {mood.name}
                {isTagSelected(mood.id) && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Instruments Filter */}
      <div className="mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setInstrumentsExpanded(!instrumentsExpanded)}
        >
          <h3 className="text-white font-normal text-xs mb-2">Instruments</h3>
          <button className="text-sm text-gray-400">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform ${instrumentsExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {instrumentsExpanded && (
          <div className="flex flex-wrap gap-1">
            {instruments.map(instrument => (
              <button
                key={instrument.id}
                className={`text-xs font-normal px-3 py-1 rounded-full mr-1 mb-1 flex items-center ${
                  isTagSelected(instrument.id) 
                    ? 'bg-[#303030] text-[#1DF7CE]' 
                    : 'bg-[#303030] text-[#CDCDCD] hover:bg-[#474545]'
                }`}
                onClick={() => handleTagClick(instrument)}
              >
                {instrument.name}
                {isTagSelected(instrument.id) && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BPM Range Slider - entirely new implementation */}
      <div className="mb-6">
        <h3 className="text-white font-normal text-xs mb-2">BPM Range</h3>
        <div className="text-xs text-gray-400 flex justify-between mb-1">
          <span>{localBpmMin}</span>
          <span>{localBpmMax} BPM</span>
        </div>
        
        {/* Slider track with clickable area */}
        <div 
          className="h-7 relative flex items-center cursor-pointer"
          onClick={(e) => {
            // Get click position relative to the slider track
            const rect = e.currentTarget.getBoundingClientRect();
            const position = (e.clientX - rect.left) / rect.width;
            
            // Convert position to BPM value (60-180 range)
            const bpmValue = Math.round(60 + position * (180 - 60));
            
            // Determine which handle to move (closest one)
            const distToMin = Math.abs(bpmValue - localBpmMin);
            const distToMax = Math.abs(bpmValue - localBpmMax);
            
            if (distToMin <= distToMax) {
              // Move min handle (ensuring it doesn't exceed max - 10)
              const newMin = Math.min(bpmValue, localBpmMax - 10);
              setLocalBpmMin(newMin);
              onBpmRangeChange(newMin, localBpmMax);
            } else {
              // Move max handle (ensuring it doesn't go below min + 10)
              const newMax = Math.max(bpmValue, localBpmMin + 10);
              setLocalBpmMax(newMax);
              onBpmRangeChange(localBpmMin, newMax);
            }
          }}
        >
          {/* Background track */}
          <div className="h-1 absolute left-0 right-0 bg-[#3C3C3C] rounded-full"></div>
          
          {/* Active track area */}
          <div 
            className="h-1 absolute bg-[#1DF7CE] rounded-full"
            style={{ 
              left: `${((localBpmMin - 60) / (180 - 60)) * 100}%`, 
              width: `${((localBpmMax - localBpmMin) / (180 - 60)) * 100}%` 
            }}
          ></div>
          
          {/* Min handle - draggable */}
          <div 
            className="w-4 h-4 bg-[#1DF7CE] rounded-full shadow-md absolute cursor-grab active:cursor-grabbing"
            style={{ left: `calc(${((localBpmMin - 60) / (180 - 60)) * 100}% - 8px)` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              
              // Starting position
              const startX = e.clientX;
              const startBpm = localBpmMin;
              const trackWidth = e.currentTarget.parentElement?.getBoundingClientRect().width || 0;
              const bpmRange = 180 - 60; // Max - Min BPM
              
              // Handle mouse move
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaBpm = Math.round((deltaX / trackWidth) * bpmRange);
                const newBpm = Math.max(60, Math.min(localBpmMax - 10, startBpm + deltaBpm));
                
                setLocalBpmMin(newBpm);
                onBpmRangeChange(newBpm, localBpmMax);
              };
              
              // Handle mouse up - remove listeners
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              // Add listeners
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          ></div>
          
          {/* Max handle - draggable */}
          <div 
            className="w-4 h-4 bg-[#1DF7CE] rounded-full shadow-md absolute cursor-grab active:cursor-grabbing"
            style={{ left: `calc(${((localBpmMax - 60) / (180 - 60)) * 100}% - 8px)` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              
              // Starting position
              const startX = e.clientX;
              const startBpm = localBpmMax;
              const trackWidth = e.currentTarget.parentElement?.getBoundingClientRect().width || 0;
              const bpmRange = 180 - 60; // Max - Min BPM
              
              // Handle mouse move
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaBpm = Math.round((deltaX / trackWidth) * bpmRange);
                const newBpm = Math.min(180, Math.max(localBpmMin + 10, startBpm + deltaBpm));
                
                setLocalBpmMax(newBpm);
                onBpmRangeChange(localBpmMin, newBpm);
              };
              
              // Handle mouse up - remove listeners
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              // Add listeners
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          ></div>
        </div>
      </div>

      {/* Duration Slider - entirely new implementation */}
      <div className="mb-6">
        <h3 className="text-white font-normal text-xs mb-2">Duration</h3>
        <div className="text-xs text-gray-400 flex justify-between mb-1">
          <span>{formatDurationForDisplay(localDurationMin)}</span>
          <span>{formatDurationForDisplay(localDurationMax)}</span>
        </div>
        
        {/* Slider track with clickable area */}
        <div 
          className="h-7 relative flex items-center cursor-pointer"
          onClick={(e) => {
            // Get click position relative to the slider track
            const rect = e.currentTarget.getBoundingClientRect();
            const position = (e.clientX - rect.left) / rect.width;
            
            // Convert position to duration value (0-600 range)
            const durationValue = Math.round(position * 600);
            
            // Determine which handle to move (closest one)
            const distToMin = Math.abs(durationValue - localDurationMin);
            const distToMax = Math.abs(durationValue - localDurationMax);
            
            if (distToMin <= distToMax) {
              // Move min handle (ensuring it doesn't exceed max - 30)
              const newMin = Math.min(durationValue, localDurationMax - 30);
              setLocalDurationMin(newMin);
              onDurationRangeChange(newMin, localDurationMax);
            } else {
              // Move max handle (ensuring it doesn't go below min + 30)
              const newMax = Math.max(durationValue, localDurationMin + 30);
              setLocalDurationMax(newMax);
              onDurationRangeChange(localDurationMin, newMax);
            }
          }}
        >
          {/* Background track */}
          <div className="h-1 absolute left-0 right-0 bg-[#3C3C3C] rounded-full"></div>
          
          {/* Active track area */}
          <div 
            className="h-1 absolute bg-[#1DF7CE] rounded-full"
            style={{ 
              left: `${(localDurationMin / 600) * 100}%`, 
              width: `${((localDurationMax - localDurationMin) / 600) * 100}%` 
            }}
          ></div>
          
          {/* Min handle - draggable */}
          <div 
            className="w-4 h-4 bg-[#1DF7CE] rounded-full shadow-md absolute cursor-grab active:cursor-grabbing"
            style={{ left: `calc(${(localDurationMin / 600) * 100}% - 8px)` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              
              // Starting position
              const startX = e.clientX;
              const startDuration = localDurationMin;
              const trackWidth = e.currentTarget.parentElement?.getBoundingClientRect().width || 0;
              
              // Handle mouse move
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaDuration = Math.round((deltaX / trackWidth) * 600);
                const newDuration = Math.max(0, Math.min(localDurationMax - 30, startDuration + deltaDuration));
                
                setLocalDurationMin(newDuration);
                onDurationRangeChange(newDuration, localDurationMax);
              };
              
              // Handle mouse up - remove listeners
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              // Add listeners
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          ></div>
          
          {/* Max handle - draggable */}
          <div 
            className="w-4 h-4 bg-[#1DF7CE] rounded-full shadow-md absolute cursor-grab active:cursor-grabbing"
            style={{ left: `calc(${(localDurationMax / 600) * 100}% - 8px)` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              
              // Starting position
              const startX = e.clientX;
              const startDuration = localDurationMax;
              const trackWidth = e.currentTarget.parentElement?.getBoundingClientRect().width || 0;
              
              // Handle mouse move
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaDuration = Math.round((deltaX / trackWidth) * 600);
                const newDuration = Math.min(600, Math.max(localDurationMin + 30, startDuration + deltaDuration));
                
                setLocalDurationMax(newDuration);
                onDurationRangeChange(localDurationMin, newDuration);
              };
              
              // Handle mouse up - remove listeners
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              // Add listeners
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          ></div>
        </div>
      </div>
    </div>
  );
} 