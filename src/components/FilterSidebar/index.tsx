'use client';

import React, { useState, useEffect } from 'react';
import { Tag } from '../../types';
import SearchBar from '../SearchBar';
import TagButton from './TagButton';
import RangeSlider from './RangeSlider';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '../../contexts/SidebarContext';

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
  bpmRange = [0, 200],
  durationRange = [0, 600],
  onTagToggle,
  onBpmChange,
  onDurationChange,
  onSearch
}: FilterSidebarProps): React.ReactElement {
  const [genreExpanded, setGenreExpanded] = useState(true);
  const [moodExpanded, setMoodExpanded] = useState(true);
  const [instrumentsExpanded, setInstrumentsExpanded] = useState(true);
  const [localBpmRange, setLocalBpmRange] = useState<[number, number]>(bpmRange);
  const [localDurationRange, setLocalDurationRange] = useState<[number, number]>(durationRange);
  const { isCollapsed, toggleCollapse } = useSidebar();
  
  // Format duration for display
  const formatDurationForDisplay = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Update local state when props change (e.g., when URL parameters are applied)
  useEffect(() => {
    setLocalBpmRange(bpmRange);
  }, [bpmRange]);
  
  useEffect(() => {
    setLocalDurationRange(durationRange);
  }, [durationRange]);
  
  // Handle BPM range changes (final changes)
  const handleBpmChange = (range: [number, number]) => {
    setLocalBpmRange(range);
    onBpmChange(range);
  };
  
  // Handle BPM range drags (real-time updates)
  const handleBpmDrag = (range: [number, number]) => {
    setLocalBpmRange(range);
  };
  
  // Handle Duration range changes (final changes)
  const handleDurationChange = (range: [number, number]) => {
    setLocalDurationRange(range);
    onDurationChange(range);
  };
  
  // Handle Duration range drags (real-time updates)
  const handleDurationDrag = (range: [number, number]) => {
    setLocalDurationRange(range);
  };
  
  // Check if tag is selected
  const isTagSelected = (tagId: string) => {
    return selectedTags.some(tag => tag.id === tagId);
  };
  
  // Toggle sections
  const toggleSection = (section: 'genre' | 'mood' | 'instruments') => {
    switch (section) {
      case 'genre':
        setGenreExpanded(!genreExpanded);
        break;
      case 'mood':
        setMoodExpanded(!moodExpanded);
        break;
      case 'instruments':
        setInstrumentsExpanded(!instrumentsExpanded);
        break;
    }
  };

  return (
    <aside
      className="fixed top-0 left-0 h-screen bg-[#1B1B1B] overflow-y-auto z-20 transition-all duration-300"
      style={{ 
        width: isCollapsed ? '80px' : '295px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Collapsed sidebar content */}
      {isCollapsed && (
        <div className="flex flex-col items-center pt-[30px] space-y-8">
          {/* Small logo */}
          <Link href="/" className="flex items-center justify-center">
            <div className="w-10 h-10 relative">
              <Image 
                src="/wave_cave_logo.png" 
                alt="Wave Cave" 
                width={40} 
                height={40}
                priority
                className="object-contain"
                quality={100}
              />
            </div>
          </Link>
          
          {/* Search icon */}
          <button 
            className="flex flex-col items-center cursor-pointer w-full py-2 hover:bg-[#282828] transition-colors"
            onClick={toggleCollapse}
            aria-label="Expand sidebar"
          >
            <span className="material-symbols-outlined text-[#1DF7CE] mb-1" style={{ fontSize: '24px' }}>search</span>
            <span className="text-white text-[10px]">Search</span>
          </button>
          
          {/* Genre icon */}
          <button 
            className="flex flex-col items-center cursor-pointer w-full py-2 hover:bg-[#282828] transition-colors"
            onClick={toggleCollapse}
            aria-label="Expand sidebar to show genres"
          >
            <svg className="w-6 h-6 text-white mb-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 12L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-white text-[10px]">Genre</span>
          </button>
          
          {/* Mood icon */}
          <button 
            className="flex flex-col items-center cursor-pointer w-full py-2 hover:bg-[#282828] transition-colors"
            onClick={toggleCollapse}
            aria-label="Expand sidebar to show moods"
          >
            <span className="material-symbols-outlined text-white mb-1" style={{ fontSize: '24px' }}>sentiment_calm</span>
            <span className="text-white text-[10px]">Mood</span>
          </button>
          
          {/* Instrument icon */}
          <button 
            className="flex flex-col items-center cursor-pointer w-full py-2 hover:bg-[#282828] transition-colors"
            onClick={toggleCollapse}
            aria-label="Expand sidebar to show instruments"
          >
            <span className="material-symbols-outlined text-white mb-1" style={{ fontSize: '24px' }}>piano</span>
            <span className="text-white text-[10px]">Instruments</span>
          </button>
          
          {/* BPM icon */}
          <button 
            className="flex flex-col items-center cursor-pointer w-full py-2 hover:bg-[#282828] transition-colors"
            onClick={toggleCollapse}
            aria-label="Expand sidebar to show BPM controls"
          >
            <svg
              className="text-white mb-1" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 3.5L5 20H19L12 3.5Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M12 3.5V14" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
              />
              <circle 
                cx="17" 
                cy="7" 
                r="2" 
                stroke="currentColor" 
                strokeWidth="2" 
              />
              <line 
                x1="6" 
                y1="13" 
                x2="18" 
                y2="13" 
                stroke="currentColor" 
                strokeWidth="1.5" 
              />
            </svg>
            <span className="text-white text-[10px]">BPM</span>
          </button>
          
          {/* Duration icon */}
          <button 
            className="flex flex-col items-center cursor-pointer w-full py-2 hover:bg-[#282828] transition-colors"
            onClick={toggleCollapse}
            aria-label="Expand sidebar to show duration controls"
          >
            <span className="material-symbols-outlined text-white mb-1" style={{ fontSize: '24px' }}>schedule</span>
            <span className="text-white text-[10px]">Duration</span>
          </button>
        </div>
      )}

      {/* Expanded sidebar content */}
      {!isCollapsed && (
        <div>
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
                onClick={() => toggleSection('genre')}
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
                      onClick={() => onTagToggle(genre)}
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
                onClick={() => toggleSection('mood')}
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
                      onClick={() => onTagToggle(mood)}
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
                onClick={() => toggleSection('instruments')}
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
                      onClick={() => onTagToggle(instrument)}
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
              <h3 className="text-white font-normal text-sm mb-3">BPM Range</h3>
              <div className="flex justify-between mb-2">
                <span className="text-white text-sm font-normal">{localBpmRange[0]}</span>
                <span className="text-white text-sm font-normal">{localBpmRange[1] === 200 ? "200+" : localBpmRange[1]}</span>
              </div>
              <RangeSlider
                min={0}
                max={200}
                value={localBpmRange}
                onChange={handleBpmChange}
                onDrag={handleBpmDrag}
                accentColor="#1DF7CE"
                height={3}
                hideLabels={true}
              />
            </div>
            
            {/* Duration Range Slider */}
            <div className="mb-6">
              <h3 className="text-white font-normal text-sm mb-3">Duration</h3>
              <div className="flex justify-between mb-2">
                <span className="text-white text-sm font-normal">{formatDurationForDisplay(localDurationRange[0])}</span>
                <span className="text-white text-sm font-normal">{localDurationRange[1] === 600 ? "10:00+" : formatDurationForDisplay(localDurationRange[1])}</span>
              </div>
              <RangeSlider
                min={0}
                max={600}
                value={localDurationRange}
                onChange={handleDurationChange}
                onDrag={handleDurationDrag}
                formatLabel={formatDurationForDisplay}
                accentColor="#1DF7CE"
                height={3}
                hideLabels={true}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// Filter section component
interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="mb-6">
      <button 
        className="flex w-full items-center justify-between cursor-pointer"
        onClick={onToggle}
        type="button"
      >
        <h3 className="text-white font-normal text-sm mb-2">{title}</h3>
        <span className="text-sm text-gray-400">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      
      {isExpanded && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </div>
  );
} 