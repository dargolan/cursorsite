'use client';

import React, { useState, useEffect } from 'react';
import { Tag } from '../types';

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
  onDurationChange
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
    <div className="w-64 bg-[#1B1B1B] min-h-screen p-4 border-r border-gray-800 sticky top-0 left-0 h-screen overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-[#1DF7CE] font-normal text-sm mb-2">Filters</h3>
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

      {/* BPM Range Slider */}
      <div className="mb-6">
        <h3 className="text-white font-normal text-xs mb-2">BPM Range</h3>
        <div className="text-xs text-gray-400 flex justify-between mb-1">
          <span>{localBpmMin} BPM</span>
          <span>{localBpmMax} BPM</span>
        </div>
        <div className="relative h-1 bg-[#474545] rounded-full mb-4">
          <div 
            className="absolute h-1 bg-[#1DF7CE] rounded-full"
            style={{ 
              left: `${((localBpmMin - 0) / (200 - 0)) * 100}%`, 
              right: `${100 - ((localBpmMax - 0) / (200 - 0)) * 100}%` 
            }}
          ></div>
          
          {/* Min thumb */}
          <div 
            className="absolute w-3 h-3 bg-white rounded-full -ml-1.5 top-1/2 transform -translate-y-1/2 cursor-pointer hover:bg-[#1DF7CE]"
            style={{ left: `${((localBpmMin - 0) / (200 - 0)) * 100}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              
              const slider = e.currentTarget.parentElement;
              if (!slider) return;
              
              const sliderRect = slider.getBoundingClientRect();
              const sliderWidth = sliderRect.width;
              const startX = e.clientX;
              const startLeft = ((localBpmMin - 0) / (200 - 0)) * sliderWidth;
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const newLeft = Math.max(0, Math.min(startLeft + deltaX, sliderWidth));
                const newMin = Math.round((newLeft / sliderWidth) * (200 - 0));
                if (newMin < localBpmMax - 10) {
                  setLocalBpmMin(newMin);
                  onBpmChange([newMin, localBpmMax]);
                }
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          ></div>
          
          {/* Max thumb */}
          <div 
            className="absolute w-3 h-3 bg-white rounded-full -mr-1.5 top-1/2 transform -translate-y-1/2 cursor-pointer hover:bg-[#1DF7CE]"
            style={{ left: `${((localBpmMax - 0) / (200 - 0)) * 100}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              
              const slider = e.currentTarget.parentElement;
              if (!slider) return;
              
              const sliderRect = slider.getBoundingClientRect();
              const sliderWidth = sliderRect.width;
              const startX = e.clientX;
              const startLeft = ((localBpmMax - 0) / (200 - 0)) * sliderWidth;
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const newLeft = Math.max(0, Math.min(startLeft + deltaX, sliderWidth));
                const newMax = Math.round((newLeft / sliderWidth) * (200 - 0));
                if (newMax > localBpmMin + 10) {
                  setLocalBpmMax(newMax);
                  onBpmChange([localBpmMin, newMax]);
                }
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          ></div>
        </div>
        
        <div className="flex gap-2">
          <input 
            type="number" 
            value={localBpmMin}
            onChange={handleBpmMinChange}
            min="0"
            max={localBpmMax - 10}
            className="w-20 bg-[#303030] text-white text-xs p-2 rounded"
          />
          <span className="text-white self-center">-</span>
          <input 
            type="number" 
            value={localBpmMax}
            onChange={handleBpmMaxChange}
            min={localBpmMin + 10}
            max="200"
            className="w-20 bg-[#303030] text-white text-xs p-2 rounded"
          />
        </div>
      </div>

      {/* Duration Range Slider */}
      <div className="mb-6">
        <h3 className="text-white font-normal text-xs mb-2">Duration</h3>
        <div className="text-xs text-gray-400 flex justify-between mb-1">
          <span>{formatDurationForDisplay(localDurationMin)}</span>
          <span>{formatDurationForDisplay(localDurationMax)}</span>
        </div>
        <div className="relative h-1 bg-[#474545] rounded-full mb-4">
          <div 
            className="absolute h-1 bg-[#1DF7CE] rounded-full"
            style={{ 
              left: `${((localDurationMin - 0) / (600 - 0)) * 100}%`, 
              right: `${100 - ((localDurationMax - 0) / (600 - 0)) * 100}%` 
            }}
          ></div>
          
          {/* Min thumb */}
          <div 
            className="absolute w-3 h-3 bg-white rounded-full -ml-1.5 top-1/2 transform -translate-y-1/2 cursor-pointer hover:bg-[#1DF7CE]"
            style={{ left: `${((localDurationMin - 0) / (600 - 0)) * 100}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              
              const slider = e.currentTarget.parentElement;
              if (!slider) return;
              
              const sliderRect = slider.getBoundingClientRect();
              const sliderWidth = sliderRect.width;
              const startX = e.clientX;
              const startLeft = ((localDurationMin - 0) / (600 - 0)) * sliderWidth;
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const newLeft = Math.max(0, Math.min(startLeft + deltaX, sliderWidth));
                const newMin = Math.round((newLeft / sliderWidth) * (600 - 0));
                if (newMin < localDurationMax - 30) {
                  setLocalDurationMin(newMin);
                  onDurationChange([newMin, localDurationMax]);
                }
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          ></div>
          
          {/* Max thumb */}
          <div 
            className="absolute w-3 h-3 bg-white rounded-full -mr-1.5 top-1/2 transform -translate-y-1/2 cursor-pointer hover:bg-[#1DF7CE]"
            style={{ left: `${((localDurationMax - 0) / (600 - 0)) * 100}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              
              const slider = e.currentTarget.parentElement;
              if (!slider) return;
              
              const sliderRect = slider.getBoundingClientRect();
              const sliderWidth = sliderRect.width;
              const startX = e.clientX;
              const startLeft = ((localDurationMax - 0) / (600 - 0)) * sliderWidth;
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const newLeft = Math.max(0, Math.min(startLeft + deltaX, sliderWidth));
                const newMax = Math.round((newLeft / sliderWidth) * (600 - 0));
                if (newMax > localDurationMin + 30) {
                  setLocalDurationMax(newMax);
                  onDurationChange([localDurationMin, newMax]);
                }
              };
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          ></div>
        </div>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            value={formatDurationForDisplay(localDurationMin)}
            readOnly
            className="w-20 bg-[#303030] text-white text-xs p-2 rounded"
          />
          <span className="text-white self-center">-</span>
          <input 
            type="text" 
            value={formatDurationForDisplay(localDurationMax)}
            readOnly
            className="w-20 bg-[#303030] text-white text-xs p-2 rounded"
          />
        </div>
      </div>
    </div>
  );
} 