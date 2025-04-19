'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import FilterSidebar from '../../components/FilterSidebar';
import TagFilter from '../../components/TagFilter';
import { Tag, Stem, Track, CartItem } from '../../types';
import Header from '../../components/Header';
import Image from 'next/image';
import { getTracks, getTags, getTracksByTags, searchTracks } from '../../services/strapi';
import { useCart } from '../../contexts/CartContext';
import AudioPlayer from '../../components/AudioPlayer';
import Footer from '../../components/Footer';
import { useDebounce } from '../../hooks/useDebounce';

// Lazy load the AudioPlayer component to improve performance
const AudioPlayerComponent = dynamic(() => import('../../components/AudioPlayer'), {
  loading: () => <div className="h-24 bg-[#1E1E1E] animate-pulse rounded"></div>,
  ssr: false, // This component uses browser APIs like wavesurfer
});

export default function MusicLibrary() {
  // State for tracks data
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add a ref to track if we've already fetched data to prevent double fetching
  const dataFetchedRef = useRef(false);
  
  // State for filters
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bpmRange, setBpmRange] = useState<[number, number]>([0, 200]);
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 600]);
  
  // Audio player state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  
  // Access cart functions from CartContext
  const { items: cartItems, addItem, removeItem, getTotalPrice } = useCart();

  // Tags categorized by type
  const [genres, setGenres] = useState<Tag[]>([]);
  const [moods, setMoods] = useState<Tag[]>([]);
  const [instruments, setInstruments] = useState<Tag[]>([]);

  // Global state to track which track's stems are open (can only be one at a time)
  const [openStemsTrackId, setOpenStemsTrackId] = useState<string | null>(null);

  // Define fetchData function for reuse
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching tracks and tags...');
      
      // Test direct fetch to check API connection - with more detailed debug info
      try {
        const testUrl = 'http://localhost:1337/api/tracks?populate=*';
        console.log('Testing API connection directly to:', testUrl);
        
        // Test if we can reach the Strapi server at all
        try {
          const pingResponse = await fetch('http://localhost:1337/admin/ping');
          const pingText = await pingResponse.text();
          console.log('Ping response from Strapi server:', pingText);
        } catch (e) {
          console.error('Failed to ping Strapi server:', e);
        }
        
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        });
        
        if (!testResponse.ok) {
          console.error(`API test failed with status: ${testResponse.status} ${testResponse.statusText}`);
          throw new Error(`API returned ${testResponse.status}`);
        }
        
        const testData = await testResponse.json();
        console.log('Direct API test successful. Response:', testData);
      } catch (e) {
        console.error('Direct API test failed:', e);
      }
      
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
      // Mark that we've completed a fetch to prevent duplicate fetches
      dataFetchedRef.current = true;
    }
  };

  // Fetch data from Strapi
  useEffect(() => {
    // Skip if we've already fetched data (prevents double fetch in StrictMode)
    if (dataFetchedRef.current) return;
    
    fetchData();
  }, []);

  // Filter tracks based on selected tags, search query, and ranges
  useEffect(() => {
    // Start with all tracks
    let filtered = [...tracks];
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      console.log('Filtering by tags:', selectedTags.map(t => `${t.name} (${t.id})`));
      filtered = filtered.filter(track => {
        // Track must have ALL selected tags
        const matches = selectedTags.every(selectedTag => 
          track.tags.some(tag => tag.id === selectedTag.id)
        );
        console.log('Track', track.title, 'has tags:', track.tags.map(t => t.name), 'matches?', matches);
        return matches;
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

  // Handler for BPM range change
  const handleBpmChange = useCallback((range: [number, number]) => {
    setBpmRange(range);
  }, []);

  // Handler for duration range change
  const handleDurationChange = useCallback((range: [number, number]) => {
    setDurationRange(range);
  }, []);

  // Handle adding a stem to the cart using CartContext
  const handleAddToCart = useCallback((stem: Stem, track: Track) => {
    addItem({
      id: stem.id,
      name: stem.name,
      trackName: track.title,
      price: stem.price,
      imageUrl: track.imageUrl
    });
  }, [addItem]);

  // Handle removing an item from the cart using CartContext
  const handleRemoveFromCart = useCallback((itemId: string) => {
    removeItem(itemId);
  }, [removeItem]);

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
          {tracks.length === 0 && (
            <div className="mt-4 p-4 bg-red-900/20 rounded-md text-left w-full max-w-md">
              <h4 className="text-red-300 mb-2">API Connection Issue</h4>
              <p className="text-sm text-gray-400 mb-2">
                No tracks were loaded from the API. This might be due to:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-400">
                <li>Strapi server not running at http://localhost:1337</li>
                <li>API permissions not set correctly in Strapi</li>
                <li>CORS issues preventing API access</li>
                <li>Data schema mismatch between frontend and API</li>
              </ul>
              <p className="text-sm text-gray-400 mt-2">
                Check the browser console for detailed error messages.
              </p>
              <button
                onClick={() => {
                  console.log('Retrying connection to API...');
                  // Reset the fetched flag so we can try again
                  dataFetchedRef.current = false;
                  // Show loading state
                  setLoading(true);
                  // Re-fetch data
                  fetchData();
                }}
                className="mt-4 px-4 py-2 bg-[#1DF7CE]/20 hover:bg-[#1DF7CE]/30 text-[#1DF7CE] rounded transition-colors text-sm"
              >
                Retry Connection
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full">
        {/* Track row */}
        {filteredTracks.map(track => (
          <div key={track.id} className="mb-0 max-w-[1464px] mx-auto w-full">
            <AudioPlayerComponent 
              track={track} 
              isPlaying={playingTrackId === track.id}
              onPlay={() => setPlayingTrackId(track.id)}
              onStop={() => setPlayingTrackId(null)}
              onTagClick={handleTagClick}
              openStemsTrackId={openStemsTrackId}
              setOpenStemsTrackId={setOpenStemsTrackId}
            />
          </div>
          ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] text-white">
      <Header />
      
      <main className="flex flex-1">
        {/* Sidebar with filter controls */}
        <FilterSidebar
          selectedTags={selectedTags}
          genres={genres}
          moods={moods}
          instruments={instruments}
          bpmRange={bpmRange}
          durationRange={durationRange}
          onTagToggle={handleTagToggle}
          onBpmChange={handleBpmChange}
          onDurationChange={handleDurationChange}
          onSearch={handleSearch}
        />
        
        {/* Main content area with tracks list */}
        <div className="ml-[295px] flex-1">
          <div className="p-8 pt-24">
            
            {/* Fixed height container for selected tags */}
            <div className="h-[40px] mb-4">
              {/* Selected tags display with clear button */}
              {(selectedTags.length > 0 || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedTags.map(tag => (
                    <TagFilter
                      key={tag.id}
                      tag={tag} 
                      selected={true} 
                      onClick={() => handleTagToggle(tag)}
                    />
                  ))}
                  
                  {/* Display search query as a tag-like filter */}
                  {searchQuery && (
                    <div className="flex items-center space-x-1 text-xs font-normal px-3 py-1 rounded-full bg-[#303030] text-[#1DF7CE] border border-[#1DF7CE]">
                      <span>Search: {searchQuery}</span>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="ml-1 text-[#1DF7CE] hover:text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => {
                      handleClearTags();
                      setSearchQuery('');
                    }}
                    className="text-sm text-white bg-transparent hover:text-[#1DF7CE] transition-colors ml-2 flex items-center"
                  >
                    Clear All <span className="ml-1">×</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Tracks list */}
            {renderContent()}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 