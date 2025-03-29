'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import FilterSidebar from '../components/FilterSidebar';
import TagFilter from '../components/TagFilter';
import { Tag, Stem, Track, CartItem } from '../types';
import Header from '../components/Header';
import Image from 'next/image';

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
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 180]);
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 600]);
  
  // Audio player state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  
  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);

  // Mock data for genre, mood, and instrument filters
  const [genres, setGenres] = useState<Tag[]>([]);
  const [moods, setMoods] = useState<Tag[]>([]);
  const [instruments, setInstruments] = useState<Tag[]>([]);

  // Generate mock tracks data
  useEffect(() => {
    // Create sample tags
    const sampleGenres: Tag[] = [
      { id: 'g1', name: 'Pop', type: 'genre', count: 12 },
      { id: 'g2', name: 'Rock', type: 'genre', count: 8 },
      { id: 'g3', name: 'Hip Hop', type: 'genre', count: 10 },
      { id: 'g4', name: 'Electronic', type: 'genre', count: 15 },
      { id: 'g5', name: 'Ambient', type: 'genre', count: 5 },
    ];
    
    const sampleMoods: Tag[] = [
      { id: 'm1', name: 'Happy', type: 'mood', count: 14 },
      { id: 'm2', name: 'Sad', type: 'mood', count: 7 },
      { id: 'm3', name: 'Energetic', type: 'mood', count: 12 },
      { id: 'm4', name: 'Relaxed', type: 'mood', count: 9 },
      { id: 'm5', name: 'Dark', type: 'mood', count: 6 },
    ];
    
    const sampleInstruments: Tag[] = [
      { id: 'i1', name: 'Piano', type: 'instrument', count: 16 },
      { id: 'i2', name: 'Guitar', type: 'instrument', count: 13 },
      { id: 'i3', name: 'Drums', type: 'instrument', count: 18 },
      { id: 'i4', name: 'Synth', type: 'instrument', count: 14 },
      { id: 'i5', name: 'Strings', type: 'instrument', count: 8 },
    ];
    
    setGenres(sampleGenres);
    setMoods(sampleMoods);
    setInstruments(sampleInstruments);

    // Use a stable seed for random numbers to ensure consistent data between renders
    // This would normally be an API call
    const mockTracks: Track[] = [
      {
        id: 'track-1',
        title: 'Ska Music 1',
        bpm: 93,
        tags: [
          { id: 'g2', name: 'Rock', type: 'genre' },
          { id: 'g4', name: 'Electronic', type: 'genre' },
          { id: 'm3', name: 'Energetic', type: 'mood' },
          { id: 'm5', name: 'Dark', type: 'mood' },
          { id: 'm1', name: 'Happy', type: 'mood' },
          { id: 'i2', name: 'Guitar', type: 'instrument' },
          { id: 'i3', name: 'Drums', type: 'instrument' },
          { id: 'i4', name: 'Synth', type: 'instrument' }
        ],
        duration: 169,
        imageUrl: 'https://picsum.photos/seed/1/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 5) * 0.5 + 0.5),
        hasStems: true,
        stems: [
          { id: 'stem-1-1', name: 'Drums', url: '/dummy-audio.mp3', price: 0.99, duration: 169 },
          { id: 'stem-1-2', name: 'Bass', url: '/dummy-audio.mp3', price: 0.99, duration: 169 },
          { id: 'stem-1-3', name: 'Guitar', url: '/dummy-audio.mp3', price: 0.99, duration: 169 },
          { id: 'stem-1-4', name: 'Vocals', url: '/dummy-audio.mp3', price: 0.99, duration: 169 }
        ]
      },
      {
        id: 'track-2',
        title: 'Ska Music 2',
        bpm: 176,
        tags: [
          { id: 'g4', name: 'Electronic', type: 'genre' },
          { id: 'm5', name: 'Dark', type: 'mood' },
          { id: 'm1', name: 'Happy', type: 'mood' },
          { id: 'i4', name: 'Synth', type: 'instrument' }
        ],
        duration: 357,
        imageUrl: 'https://picsum.photos/seed/2/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 4) * 0.5 + 0.5),
        hasStems: true,
        stems: [
          { id: 'stem-2-1', name: 'Drums', url: '/dummy-audio.mp3', price: 0.99, duration: 357 },
          { id: 'stem-2-2', name: 'Bass', url: '/dummy-audio.mp3', price: 0.99, duration: 357 },
          { id: 'stem-2-3', name: 'Synth', url: '/dummy-audio.mp3', price: 0.99, duration: 357 },
          { id: 'stem-2-4', name: 'Vocals', url: '/dummy-audio.mp3', price: 0.99, duration: 357 }
        ]
      },
      {
        id: 'track-3',
        title: 'Ska Music 3',
        bpm: 129,
        tags: [
          { id: 'g1', name: 'Pop', type: 'genre' },
          { id: 'm3', name: 'Energetic', type: 'mood' },
          { id: 'i5', name: 'Strings', type: 'instrument' },
          { id: 'i3', name: 'Drums', type: 'instrument' }
        ],
        duration: 185,
        imageUrl: 'https://picsum.photos/seed/3/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 6) * 0.5 + 0.5),
        hasStems: false
      },
      {
        id: 'track-4',
        title: 'Ska Music 4',
        bpm: 108,
        tags: [
          { id: 'g4', name: 'Electronic', type: 'genre' },
          { id: 'm1', name: 'Happy', type: 'mood' },
          { id: 'i2', name: 'Guitar', type: 'instrument' }
        ],
        duration: 256,
        imageUrl: 'https://picsum.photos/seed/4/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 3) * 0.5 + 0.5),
        hasStems: false
      },
      {
        id: 'track-5',
        title: 'Ska Music 5',
        bpm: 105,
        tags: [
          { id: 'g5', name: 'Ambient', type: 'genre' },
          { id: 'g1', name: 'Pop', type: 'genre' },
          { id: 'm1', name: 'Happy', type: 'mood' },
          { id: 'm4', name: 'Relaxed', type: 'mood' },
          { id: 'm2', name: 'Sad', type: 'mood' },
          { id: 'i1', name: 'Piano', type: 'instrument' },
          { id: 'i5', name: 'Strings', type: 'instrument' },
          { id: 'i4', name: 'Synth', type: 'instrument' }
        ],
        duration: 317,
        imageUrl: 'https://picsum.photos/seed/5/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 5) * 0.5 + 0.5),
        hasStems: true,
        stems: [
          { id: 'stem-5-1', name: 'Piano', url: '/dummy-audio.mp3', price: 0.99, duration: 317 },
          { id: 'stem-5-2', name: 'Strings', url: '/dummy-audio.mp3', price: 0.99, duration: 317 },
          { id: 'stem-5-3', name: 'Pads', url: '/dummy-audio.mp3', price: 0.99, duration: 317 }
        ]
      },
      {
        id: 'track-6',
        title: 'Ska Music 6',
        bpm: 143,
        tags: [
          { id: 'g3', name: 'Hip Hop', type: 'genre' },
          { id: 'm1', name: 'Happy', type: 'mood' },
          { id: 'i5', name: 'Strings', type: 'instrument' },
          { id: 'i3', name: 'Drums', type: 'instrument' }
        ],
        duration: 205,
        imageUrl: 'https://picsum.photos/seed/6/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 4) * 0.5 + 0.5),
        hasStems: true,
        stems: [
          { id: 'stem-6-1', name: 'Drums', url: '/dummy-audio.mp3', price: 0.99, duration: 205 },
          { id: 'stem-6-2', name: 'Bass', url: '/dummy-audio.mp3', price: 0.99, duration: 205 },
          { id: 'stem-6-3', name: 'Strings', url: '/dummy-audio.mp3', price: 0.99, duration: 205 },
          { id: 'stem-6-4', name: 'Vocals', url: '/dummy-audio.mp3', price: 0.99, duration: 205 }
        ]
      },
      {
        id: 'track-7',
        title: 'Ska Music 7',
        bpm: 132,
        tags: [
          { id: 'g3', name: 'Hip Hop', type: 'genre' },
          { id: 'm1', name: 'Happy', type: 'mood' },
          { id: 'i5', name: 'Strings', type: 'instrument' }
        ],
        duration: 267,
        imageUrl: 'https://picsum.photos/seed/7/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 3) * 0.5 + 0.5),
        hasStems: false
      },
      {
        id: 'track-8',
        title: 'Ska Music 8',
        bpm: 159,
        tags: [
          { id: 'g5', name: 'Ambient', type: 'genre' },
          { id: 'm5', name: 'Dark', type: 'mood' },
          { id: 'i4', name: 'Synth', type: 'instrument' }
        ],
        duration: 350,
        imageUrl: 'https://picsum.photos/seed/8/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 7) * 0.5 + 0.5),
        hasStems: true,
        stems: [
          { id: 'stem-8-1', name: 'Synth 1', url: '/dummy-audio.mp3', price: 0.99, duration: 350 },
          { id: 'stem-8-2', name: 'Synth 2', url: '/dummy-audio.mp3', price: 0.99, duration: 350 },
          { id: 'stem-8-3', name: 'Pads', url: '/dummy-audio.mp3', price: 0.99, duration: 350 },
          { id: 'stem-8-4', name: 'Ambient Textures', url: '/dummy-audio.mp3', price: 0.99, duration: 350 }
        ]
      },
      {
        id: 'track-9',
        title: 'Ska Music 9',
        bpm: 71,
        tags: [
          { id: 'g4', name: 'Electronic', type: 'genre' },
          { id: 'm1', name: 'Happy', type: 'mood' },
          { id: 'm2', name: 'Sad', type: 'mood' },
          { id: 'i3', name: 'Drums', type: 'instrument' }
        ],
        duration: 199,
        imageUrl: 'https://picsum.photos/seed/9/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 6) * 0.5 + 0.5),
        hasStems: true,
        stems: [
          { id: 'stem-9-1', name: 'Drums', url: '/dummy-audio.mp3', price: 0.99, duration: 199 },
          { id: 'stem-9-2', name: 'Bass', url: '/dummy-audio.mp3', price: 0.99, duration: 199 },
          { id: 'stem-9-3', name: 'Synth', url: '/dummy-audio.mp3', price: 0.99, duration: 199 }
        ]
      },
      {
        id: 'track-10',
        title: 'Ska Music 10',
        bpm: 117,
        tags: [
          { id: 'g2', name: 'Rock', type: 'genre' },
          { id: 'm3', name: 'Energetic', type: 'mood' },
          { id: 'm1', name: 'Happy', type: 'mood' },
          { id: 'i2', name: 'Guitar', type: 'instrument' }
        ],
        duration: 260,
        imageUrl: 'https://picsum.photos/seed/10/200/200',
        audioUrl: '/dummy-audio.mp3',
        waveform: Array(100).fill(0).map((_, i) => Math.sin(i / 5) * 0.5 + 0.5),
        hasStems: false
      }
    ];

    setTracks(mockTracks);
    setFilteredTracks(mockTracks);
    setLoading(false);
  }, []); // Empty dependency array to ensure this runs only once

  // Optimize filtering to prevent rerendering when nothing has changed
  useEffect(() => {
    if (tracks.length === 0) return;
    
    let filtered = [...tracks];
    
    // Apply tag filters
    if (selectedTags.length > 0) {
      const tagIds = selectedTags.map(tag => tag.id);
      filtered = filtered.filter(track => {
        const trackTagIds = track.tags.map(tag => tag.id);
        return tagIds.every(tagId => trackTagIds.includes(tagId));
      });
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(track => {
        const titleMatch = track.title.toLowerCase().includes(query);
        const tagMatch = track.tags.some(tag => tag.name.toLowerCase().includes(query));
        return titleMatch || tagMatch;
      });
    }
    
    // Apply BPM range
    filtered = filtered.filter(track => {
      return track.bpm >= bpmRange[0] && track.bpm <= bpmRange[1];
    });
    
    // Apply duration range
    filtered = filtered.filter(track => {
      return track.duration >= durationRange[0] && track.duration <= durationRange[1];
    });
    
    // Maintain consistent order by sorting by id (or title)
    filtered.sort((a, b) => {
      // Extract the numeric part from "track-X" id format and compare
      const idA = parseInt(a.id.split('-')[1]);
      const idB = parseInt(b.id.split('-')[1]);
      return idA - idB;
    });
    
    setFilteredTracks(filtered);
  }, [tracks, selectedTags, searchQuery, bpmRange, durationRange]);

  // Update cart total when items change
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.price, 0);
    setCartTotal(total);
    
    // Update the header cart count
    const headerCartCounter = document.getElementById('header-cart-total');
    if (headerCartCounter) {
      headerCartCounter.textContent = total.toFixed(2);
    }
  }, [cartItems]);

  // Handler functions
  const handleTagSelect = useCallback((tag: Tag) => {
    setSelectedTags(prev => [...prev, tag]);
  }, []);

  const handleTagDeselect = useCallback((tagId: string) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
  }, []);

  const handleClearAllTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleBpmRangeChange = useCallback((min: number, max: number) => {
    setBpmRange([min, max]);
  }, []);

  const handleDurationRangeChange = useCallback((min: number, max: number) => {
    setDurationRange([min, max]);
  }, []);

  const handlePlayPause = useCallback((trackId: string) => {
    setPlayingTrackId(prev => prev === trackId ? null : trackId);
  }, []);

  const handleAddToCart = useCallback((item: { id: string, type: 'track' | 'stem', price: number }) => {
    setCartItems(prev => {
      // Check if item already exists
      if (prev.some(prevItem => prevItem.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  // Memoize the filtered tracks count to prevent it from changing on every render
  const filteredTracksCount = React.useMemo(() => filteredTracks.length, [filteredTracks]);
  
  // Create a stable count display text
  const trackCountText = React.useMemo(() => {
    return `${filteredTracksCount} track${filteredTracksCount !== 1 ? 's' : ''} found`;
  }, [filteredTracksCount]);

  return (
    <div className="flex flex-1">
      {/* Sidebar with filters */}
      <FilterSidebar
        genres={genres}
        moods={moods}
        instruments={instruments}
        selectedTags={selectedTags}
        onTagSelect={handleTagSelect}
        onTagDeselect={handleTagDeselect}
        onSearchChange={handleSearchChange}
        onBpmRangeChange={handleBpmRangeChange}
        onDurationRangeChange={handleDurationRangeChange}
        bpmRange={bpmRange}
        durationRange={durationRange}
      />

      {/* Main content */}
      <div className="flex-grow px-6 py-8">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white pl-[30px]">Music Library</h1>
          <div className="text-white min-w-[100px] text-right">
            {trackCountText}
          </div>
        </div>
        
        {/* Active filters area with fixed height */}
        <div className="pl-[30px] mb-2 min-h-[50px]">
          <TagFilter
            selectedTags={selectedTags}
            onRemoveTag={handleTagDeselect}
            onClearAllTags={handleClearAllTags}
          />
        </div>
        
        {/* Track listing */}
        <div className="w-full">
          {filteredTracks.length === 0 && !loading ? (
            <div className="text-center text-[#CDCDCD] p-12">
              <p>No tracks match your filters. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div>
              {loading ? (
                <div className="w-full flex justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DF7CE]"></div>
                </div>
              ) : (
                filteredTracks.map(track => (
                  <div key={track.id} className="mb-[-1px]">
                    <AudioPlayer 
                      track={track}
                      isPlaying={playingTrackId === track.id}
                      onPlayPause={handlePlayPause}
                      onAddToCart={handleAddToCart}
                      onTagClick={handleTagSelect}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 