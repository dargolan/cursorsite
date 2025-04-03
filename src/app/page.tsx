'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import FilterSidebar from '../components/FilterSidebar';
import TagFilter from '../components/TagFilter';
import SearchBar from '../components/SearchBar';
import { Tag, Stem, Track, CartItem } from '../types';
import Header from '../components/Header';
import Image from 'next/image';
import { getTracks, getTags, printStrapiAPIStructure } from '../services/api';
import { getCart, addToCart, removeFromCart, getCartTotal } from '../services/cart';

// Lazy load the AudioPlayer component to improve performance
const AudioPlayer = dynamic(() => import('../components/AudioPlayer'), {
  loading: () => <div className="h-24 bg-[#1E1E1E] animate-pulse rounded"></div>,
  ssr: false, // This component uses browser APIs like wavesurfer
});

export default function MusicLibrary() {
  // State for tracks data
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for filters
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bpmRange, setBpmRange] = useState<[number, number]>([0, 200]);
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 600]);
  
  // Audio player state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);

  // Tags categorized by type
  const [genres, setGenres] = useState<Tag[]>([]);
  const [moods, setMoods] = useState<Tag[]>([]);
  const [instruments, setInstruments] = useState<Tag[]>([]);

  // Fetch data from Strapi
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching tracks and tags...');
        
        // Debug the Strapi API structure
        await printStrapiAPIStructure();
        
        // Fetch tracks
        const tracksData = await getTracks();
        console.log('Tracks fetched:', tracksData.length);
        setTracks(tracksData);
        setFilteredTracks(tracksData);
        
        // Fetch tags
        const tagsData = await getTags();
        console.log('Tags fetched:', tagsData.length);
        
        // Categorize tags
        const genresList = tagsData.filter(tag => tag.type === 'genre');
        const moodsList = tagsData.filter(tag => tag.type === 'mood');
        const instrumentsList = tagsData.filter(tag => tag.type === 'instrument');
        
        console.log('Genres:', genresList.length);
        console.log('Moods:', moodsList.length);
        console.log('Instruments:', instrumentsList.length);
        
        // Count tag occurrences in tracks
        const tagCounts = new Map<string, number>();
        tracksData.forEach(track => {
          track.tags.forEach(tag => {
            const count = tagCounts.get(tag.id) || 0;
            tagCounts.set(tag.id, count + 1);
          });
        });
        
        // Add count property to tags
        genresList.forEach(tag => tag.count = tagCounts.get(tag.id) || 0);
        moodsList.forEach(tag => tag.count = tagCounts.get(tag.id) || 0);
        instrumentsList.forEach(tag => tag.count = tagCounts.get(tag.id) || 0);
        
        setGenres(genresList);
        setMoods(moodsList);
        setInstruments(instrumentsList);
      } catch (error) {
        console.error('Error fetching data:', error);
        // If API fails, use an empty state
        setTracks([]);
        setFilteredTracks([]);
        setGenres([]);
        setMoods([]);
        setInstruments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      const cart = getCart();
      setCartItems(cart);
      setCartTotal(getCartTotal());
    };
    
    loadCart();
    
    // Listen for storage events to update cart if changed in another tab
    window.addEventListener('storage', loadCart);
    
    return () => {
      window.removeEventListener('storage', loadCart);
    };
  }, []);

  // Filter tracks based on selected tags, search query, and ranges
  useEffect(() => {
    // Start with all tracks
    let filtered = [...tracks];
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(track => {
        // Track must have ALL selected tags
        return selectedTags.every(selectedTag => 
          track.tags.some(tag => tag.id === selectedTag.id)
        );
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(track => 
        track.title.toLowerCase().includes(query) ||
        track.tags.some(tag => tag.name.toLowerCase().includes(query))
      );
    }
    
    // Filter by BPM range
    filtered = filtered.filter(track => 
      track.bpm >= bpmRange[0] && track.bpm <= bpmRange[1]
    );
    
    // Filter by duration range
    filtered = filtered.filter(track => 
      track.duration >= durationRange[0] && track.duration <= durationRange[1]
    );
    
    setFilteredTracks(filtered);
  }, [tracks, selectedTags, searchQuery, bpmRange, durationRange]);

  // Handler for toggling a tag
  const handleTagToggle = useCallback((tag: Tag) => {
    setSelectedTags(prevTags => {
      const isSelected = prevTags.some(t => t.id === tag.id);
      if (isSelected) {
        return prevTags.filter(t => t.id !== tag.id);
      } else {
        return [...prevTags, tag];
      }
    });
  }, []);

  // Handler for clearing all tags
  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  // Handler for search input
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handler for clearing search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handler for clearing all filters (tags and search)
  const handleClearAll = useCallback(() => {
    setSelectedTags([]);
    setSearchQuery('');
  }, []);

  // Handler for BPM range change
  const handleBpmChange = useCallback((range: [number, number]) => {
    setBpmRange(range);
  }, []);

  // Handler for duration range change
  const handleDurationChange = useCallback((range: [number, number]) => {
    setDurationRange(range);
  }, []);

  // Handler for adding a stem to cart
  const handleAddToCart = useCallback((stem: Stem, track: Track) => {
    addToCart(stem, track);
    setCartItems(getCart());
    setCartTotal(getCartTotal());
  }, []);

  // Handler for removing an item from cart
  const handleRemoveFromCart = useCallback((itemId: string) => {
    removeFromCart(itemId);
    setCartItems(getCart());
    setCartTotal(getCartTotal());
  }, []);

  // Handler for tag click
  const handleTagClick = useCallback((tag: Tag) => {
    setSelectedTags(prevTags => {
      const isSelected = prevTags.some(t => t.id === tag.id);
      if (isSelected) {
        return prevTags.filter(t => t.id !== tag.id);
      } else {
        return [...prevTags, tag];
      }
    });
  }, []);

  // Function to format duration from seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Display loading state or no results message
  const renderContent = () => {
    if (loading) {
  return (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#1DF7CE] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading tracks...</p>
        </div>
      );
    }

    if (filteredTracks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h3 className="text-lg text-gray-300 mb-2">No tracks found</h3>
          <p className="text-sm text-gray-500 max-w-md">
            Try adjusting your filters or search query
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6">
        {filteredTracks.map(track => (
          <div key={track.id} className="relative">
            <AudioPlayer
              track={track}
              isPlaying={playingTrackId === track.id}
              onPlay={() => setPlayingTrackId(track.id)}
              onStop={() => setPlayingTrackId(null)}
              onAddToCart={handleAddToCart}
              onTagClick={handleTagClick}
            />
          </div>
            ))}
          </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      <Header cartItems={cartItems} cartTotal={cartTotal} onRemoveFromCart={handleRemoveFromCart} />
      
      <main className="flex flex-1">
        {/* Sidebar with filter controls */}
        <FilterSidebar 
          genres={genres}
          moods={moods}
          instruments={instruments}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          bpmRange={bpmRange}
          onBpmChange={handleBpmChange}
          durationRange={durationRange}
          onDurationChange={handleDurationChange}
          onSearch={handleSearch}
        />
        
        {/* Main content area */}
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-5xl font-bold">Music list</h1>
          </div>
          
          {/* Selected tags and search query display with clear buttons */}
          {(selectedTags.length > 0 || searchQuery) && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {selectedTags.map(tag => (
                <TagFilter 
                  key={tag.id}
                  tag={tag} 
                  selected={true} 
                  onClick={() => handleTagToggle(tag)}
                />
              ))}
              
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="flex items-center space-x-1 text-xs font-normal px-3 py-1 rounded-full transition-colors bg-[#303030] text-[#1DF7CE] border border-[#1DF7CE]"
                >
                  <span>{searchQuery}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <button 
                onClick={handleClearAll}
                className="text-sm text-white bg-transparent hover:text-[#1DF7CE] transition-colors ml-2 flex items-center"
              >
                Clear All <span className="ml-1">×</span>
              </button>
            </div>
          )}
          
          {/* Tracks list */}
          {renderContent()}
        </div>
      </main>
    </div>
  );
} 