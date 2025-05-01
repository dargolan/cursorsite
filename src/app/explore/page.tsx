'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import FilterSidebar from '../../components/FilterSidebar/index';
import ContentWrapper from '../../components/ContentWrapper';
import TagFilter from '../../components/TagFilter';
import { Tag, Stem, Track, CartItem } from '../../types';
import Header from '../../components/Header';
import Image from 'next/image';
import { getTracks, getTags, getTracksByTags, searchTracks, getTracksWithMapping } from '../../services/strapi';
import { STRAPI_URL } from '../../config/strapi';
import { useCart } from '../../contexts/CartContext';
import Footer from '../../components/Footer';
import { useDebounce } from '../../hooks/useDebounce';

// Lazy load the AudioPlayer component to improve performance
const AudioPlayerComponent = dynamic(() => import('../../components/AudioPlayer'), {
  loading: () => <div className="h-24 bg-[#1E1E1E] animate-pulse rounded"></div>,
  ssr: false, // This component uses browser APIs like wavesurfer
});

export default function MusicLibrary() {
  // Get search params from URL
  const searchParams = useSearchParams();
  
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
      
      // Add more detailed logging
      console.log('Environment variables:');
      console.log('STRAPI_API_URL:', process.env.NEXT_PUBLIC_STRAPI_API_URL);
      console.log('Has API Token:', !!process.env.NEXT_PUBLIC_STRAPI_API_TOKEN);
      
      // Test direct fetch to check API connection
      try {
        const testUrl = 'http://localhost:1337/api/tracks?populate=*';
        console.log('Testing API connection directly to:', testUrl);
        
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        });
        
        if (!testResponse.ok) {
          console.error(`API test failed with status: ${testResponse.status} ${testResponse.statusText}`);
          const errorText = await testResponse.text();
          console.error('Error response:', errorText);
          throw new Error(`API returned ${testResponse.status}`);
        }
        
        const testData = await testResponse.json();
        console.log('Direct API test successful. Full response:', JSON.stringify(testData, null, 2));
      } catch (e) {
        console.error('Direct API test failed:', e);
      }
      
      // Fetch tracks using the new enhanced function that handles ID/UUID mapping properly
      const tracksData = await getTracksWithMapping();
      console.log('Tracks fetched with proper mapping:', tracksData.length);
      
      // The tracks from getTracksWithMapping already have proper IDs and URLs
      // No need for additional validation or UUID extraction
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
      
      // Apply URL filters after data is loaded
      applyFiltersFromURL(tagsData);
      
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

  // Apply filters from URL parameters
  const applyFiltersFromURL = useCallback((allTags: Tag[]) => {
    // Get tags from URL
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      const tagIds = tagsParam.split(',');
      const matchedTags = allTags.filter(tag => tagIds.includes(tag.id));
      setSelectedTags(matchedTags);
    }
    
    // Get BPM range from URL
    const bpmMinParam = searchParams.get('bpmMin');
    const bpmMaxParam = searchParams.get('bpmMax');
    if (bpmMinParam !== null && bpmMaxParam !== null) {
      const bpmMin = parseInt(bpmMinParam) || 0;
      const bpmMax = parseInt(bpmMaxParam) || 200;
      
      console.log(`Setting BPM range from URL: [${bpmMin}, ${bpmMax}]`);
      setBpmRange([bpmMin, bpmMax]);
    }
    
    // Get duration range from URL
    const durationMinParam = searchParams.get('durationMin');
    const durationMaxParam = searchParams.get('durationMax');
    if (durationMinParam !== null && durationMaxParam !== null) {
      const durationMin = parseInt(durationMinParam) || 0;
      const durationMax = parseInt(durationMaxParam) || 600;
      
      console.log(`Setting duration range from URL: [${durationMin}, ${durationMax}]`);
      setDurationRange([durationMin, durationMax]);
    }
    
    // Get search query from URL
    const searchParam = searchParams.get('search');
    if (searchParam) {
      // URL encoding may have replaced commas, ensure they're restored properly
      const decodedSearch = decodeURIComponent(searchParam).replace(/\+/g, ' ');
      setSearchQuery(decodedSearch);
    }
  }, [searchParams, setBpmRange, setDurationRange, setSelectedTags, setSearchQuery]);

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
      const searchTerms = searchQuery.toLowerCase().split(',').map(term => term.trim());
      
      filtered = filtered.filter(track => 
        // Check if any of the search terms match the track title or tags
        searchTerms.some(term => 
          track.title.toLowerCase().includes(term) ||
          track.tags.some(tag => tag.name.toLowerCase().includes(term))
        )
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
    // Check if we already have a search query
    if (searchQuery) {
      // Add the new term to the existing search query with comma separation
      setSearchQuery(prev => `${prev}, ${query}`);
    } else {
      // First search term
      setSearchQuery(query);
    }
  }, [searchQuery]);

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
        {filteredTracks.map((track, index) => {
          // Debug log track ID to identify any issues
          console.log(`[Track ${index}] ID: ${track.id}, title: ${track.title}, imageUrl: ${track.imageUrl}`);
          
          // Ensure track.id exists and is properly formatted
          if (!track.id || track.id === index.toString() || track.id === `${index}`) {
            console.error(`[Track ${index}] Invalid ID: "${track.id}" appears to be a sequential number`);
            
            // Try to extract UUID from imageUrl if available
            let extractedId = null;
            if (track.imageUrl && track.imageUrl.includes('/tracks/')) {
              const matches = track.imageUrl.match(/\/tracks\/([^\/]+)\/cover/);
              if (matches && matches[1]) {
                extractedId = matches[1];
                console.log(`[Track ${index}] Extracted ID from imageUrl: ${extractedId}`);
              }
            }
            
            // Create a new track with proper handling
            track = {
              ...track,
              id: extractedId || `missing-id-${index}`, // Use a unique identifier based on index
              imageUrl: extractedId 
                ? `/api/direct-s3/tracks/${extractedId}/image` // Use dynamic /image endpoint
                : `/api/placeholder-image` // Placeholder image path
            };
            console.log(`[Track ${index}] Fixed track with ID: ${track.id}`);
          }
          
          return (
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
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white overflow-x-hidden">
      <Header />
      
      <main className="relative min-h-screen">
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
          existingSearch={searchQuery}
        />
        
        <ContentWrapper>
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
                  
                  {/* Display search queries as tag-like filters */}
                  {searchQuery && searchQuery.split(',').map((term, index) => {
                    const trimmedTerm = term.trim();
                    if (!trimmedTerm) return null;
                    
                    return (
                      <div key={`search-${index}`} className="flex items-center space-x-1 text-xs font-normal px-3 py-1 rounded-full bg-[#303030] text-[#1DF7CE] border border-[#1DF7CE]">
                        <span>Search: {trimmedTerm}</span>
                        <button 
                          onClick={() => {
                            // Remove this specific search term
                            const searchTerms = searchQuery
                              .split(',')
                              .map(t => t.trim())
                              .filter((_, i) => i !== index)
                              .join(', ');
                            
                            setSearchQuery(searchTerms);
                          }}
                          className="ml-1 text-[#1DF7CE] hover:text-white"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                  
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
        </ContentWrapper>
      </main>
      <Footer />
    </div>
  );
} 