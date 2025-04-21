'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FilterSidebar from '../components/FilterSidebar/index';
import ContentWrapper from '../components/ContentWrapper';
import { getTracks, getTags } from '../services/strapi';
import { Track, Tag } from '../types';

export default function HomePage() {
  const router = useRouter();
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [genres, setGenres] = useState<Tag[]>([]);
  const [moods, setMoods] = useState<Tag[]>([]);
  const [instruments, setInstruments] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [bpmRange, setBpmRange] = useState<[number, number]>([0, 200]);
  const [durationRange, setDurationRange] = useState<[number, number]>([0, 600]);
  const [featuredProjects, setFeaturedProjects] = useState([
    {
      id: '1',
      title: 'Cinematic Documentary',
      description: 'Award-winning nature documentary featuring our ambient tracks',
      image: '/images/projects/documentary.jpg',
      link: '/projects/documentary'
    },
    {
      id: '2',
      title: 'Gaming Stream',
      description: 'Popular Twitch streamer using our electronic music',
      image: '/images/projects/gaming.jpg',
      link: '/projects/gaming'
    },
    {
      id: '3',
      title: 'Corporate Brand',
      description: 'Global tech company\'s promotional video',
      image: '/images/projects/corporate.jpg',
      link: '/projects/corporate'
    }
  ]);
  
  const [loading, setLoading] = useState(true);

  // Navigate to explore page with filters
  const navigateToExploreWithFilters = (params: {
    tags?: string[];
    bpmMin?: number;
    bpmMax?: number;
    durationMin?: number;
    durationMax?: number;
    search?: string;
  }) => {
    // Create URL search params
    const searchParams = new URLSearchParams();
    
    // Add selected tags
    if (params.tags && params.tags.length > 0) {
      searchParams.append('tags', params.tags.join(','));
    }
    
    // Add BPM range - always include these to preserve slider positions
    searchParams.append('bpmMin', params.bpmMin?.toString() || '0');
    searchParams.append('bpmMax', params.bpmMax?.toString() || '200');
    
    // Add duration range - always include these to preserve slider positions
    searchParams.append('durationMin', params.durationMin?.toString() || '0');
    searchParams.append('durationMax', params.durationMax?.toString() || '600');
    
    // Add search query if provided
    if (params.search) {
      searchParams.append('search', params.search);
    }
    
    // Navigate to explore page with filters
    const queryString = searchParams.toString();
    router.push(`/explore${queryString ? '?' + queryString : ''}`);
  };

  const handleTagToggle = (tag: Tag) => {
    // Update local state
    const newSelectedTags = selectedTags.some(t => t.id === tag.id)
      ? selectedTags.filter(t => t.id !== tag.id)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    
    // Navigate to explore page with updated tags
    navigateToExploreWithFilters({
      tags: newSelectedTags.map(tag => tag.id),
      bpmMin: bpmRange[0],
      bpmMax: bpmRange[1],
      durationMin: durationRange[0],
      durationMax: durationRange[1]
    });
  };

  const handleBpmChange = (range: [number, number]) => {
    setBpmRange(range);
    
    // Navigate to explore page with BPM range
    navigateToExploreWithFilters({
      tags: selectedTags.map(tag => tag.id),
      bpmMin: range[0],
      bpmMax: range[1],
      durationMin: durationRange[0],
      durationMax: durationRange[1]
    });
  };

  const handleDurationChange = (range: [number, number]) => {
    setDurationRange(range);
    
    // Navigate to explore page with duration range
    navigateToExploreWithFilters({
      tags: selectedTags.map(tag => tag.id),
      bpmMin: bpmRange[0],
      bpmMax: bpmRange[1],
      durationMin: range[0],
      durationMax: range[1]
    });
  };

  const handleSearch = (query: string) => {
    // Navigate to explore page with search query
    navigateToExploreWithFilters({
      tags: selectedTags.map(tag => tag.id),
      bpmMin: bpmRange[0],
      bpmMax: bpmRange[1],
      durationMin: durationRange[0],
      durationMax: durationRange[1],
      search: query
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const tracks = await getTracks();
        // Get featured tracks (limit to 4)
        setFeaturedTracks(tracks?.slice(0, 4) || []);
        
        const tags = await getTags();
        // Filter tags by type
        const genreTags = tags?.filter(tag => tag.type === 'genre') || [];
        const moodTags = tags?.filter(tag => tag.type === 'mood') || [];
        const instrumentTags = tags?.filter(tag => tag.type === 'instrument') || [];
        
        setGenres(genreTags);
        setMoods(moodTags);
        setInstruments(instrumentTags);
    } catch (error) {
      console.error('Error fetching data:', error);
        setFeaturedTracks([]);
      setGenres([]);
      setMoods([]);
      setInstruments([]);
    } finally {
      setLoading(false);
    }
  };
    
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-[#121212] text-white pb-8">
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
      
      <ContentWrapper>
        <Header />
        
        {/* Hero Section */}
        <section className="relative w-full px-8 py-4 md:py-6 mt-16">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 mb-4 md:mb-0 md:pr-8 flex flex-col justify-center">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6">
                Discover the <span className="text-[#1DF7CE]">Soundtrack</span> to Your <span className="text-[#1DF7CE]">Story</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                High-quality, royalty-free music for your creative projects
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <Link href="/explore" className="flex items-center justify-center px-6 py-3 bg-[#1DF7CE] hover:bg-[#1DF7CE]/90 text-black font-medium rounded-full transition-colors text-lg">
                  Browse Music
                </Link>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative">
              <div className="aspect-[21/9] h-[360px] md:h-[400px]">
                <Image
                  src="/images/herotest.jpg"
                  alt="Music studio workspace"
                  fill
                  className="rounded-lg shadow-2xl object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Featured Tracks Section */}
        <section className="py-16 px-8 bg-[#121212]">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">Trending Tracks</h2>
              <Link href="/explore" className="text-[#1DF7CE] hover:text-[#1DF7CE]/80 flex items-center text-sm font-medium">
                View All
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-[#1E1E1E] rounded-lg overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-gray-800"></div>
                    <div className="p-4">
                      <div className="h-5 bg-gray-800 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-800 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-gray-800 rounded w-1/4"></div>
                    </div>
                  </div>
                ))
              ) : (
                featuredTracks.map(track => (
                  <div key={track.id} className="bg-[#1E1E1E] rounded-lg overflow-hidden transition-transform hover:scale-[1.02] duration-200">
                    <div className="relative w-full h-48 bg-gray-900 flex items-center justify-center">
                      {track.imageUrl ? (
                        <Link href={`/explore?track=${track.id}`}>
                          <Image
                            src={track.imageUrl}
                            alt={track.title}
                            fill
                            className="object-cover"
                          />
                        </Link>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#282828] flex items-center justify-center">
                          <svg className="w-8 h-8 text-[#1DF7CE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <Link href={`/explore?track=${track.id}`}>
                      <div className="p-4">
                        <h3 className="text-white font-medium text-lg mb-1">{track.title}</h3>
                        <p className="text-gray-400 text-sm">{track.tags[0]?.name}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-gray-400 text-sm">{formatDuration(track.duration)} • {track.tags[0]?.name}</span>
                          <button className="text-white hover:text-[#1DF7CE] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
        
        {/* Browse by Genre Section */}
        <section className="py-16 px-8 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">Browse by Genre</h2>
              <Link href="/genres" className="text-[#1DF7CE] hover:text-[#1DF7CE]/80 flex items-center text-sm font-medium">
                All Genres
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                // Loading skeletons for genres
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gradient-to-b from-[#1E1E1E] to-[#101010] rounded-lg h-48 animate-pulse"></div>
                ))
              ) : (
                genres.map(genre => (
                  <Link key={genre.id} href={`/explore?genre=${genre.id}`} className="relative block overflow-hidden rounded-lg h-48 group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="text-white font-bold text-xl mb-1">{genre.name}</h3>
                      <p className="text-gray-300 text-sm">{genre.count || 0} tracks</p>
                </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
        
        {/* Featured Projects Section */}
        <section className="py-16 px-8 bg-[#121212]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Featured Projects</h2>
              <p className="text-gray-400">See how creators are using our music</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProjects.map(project => (
                <div key={project.id} className="bg-[#1E1E1E] rounded-lg overflow-hidden">
                  <div className="relative w-full h-48 bg-gray-900">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-white font-bold text-xl mb-2">{project.title}</h3>
                    <p className="text-gray-400 mb-4">{project.description}</p>
                    <button className="flex items-center text-[#1DF7CE] hover:text-[#1DF7CE]/80 text-sm font-medium">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Watch Project
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="py-16 px-8 bg-[#0A0A0A]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Stay in the Loop</h2>
            <p className="text-gray-300 mb-8 text-sm">Subscribe to get the latest updates on new tracks and exclusive offers</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-96">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg 
                    className="w-5 h-5 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="block w-full py-2 pl-12 pr-4 text-base rounded-full bg-[#1E1E1E] border border-[#CDCDCD] text-white focus:outline-none focus:ring-1 focus:ring-[#1DF7CE]" 
                />
              </div>
              <button className="w-full sm:w-auto whitespace-nowrap px-5 py-2 bg-[#1DF7CE] hover:bg-[#1DF7CE]/90 text-black font-medium rounded-full transition-colors text-sm">
                Subscribe
              </button>
            </div>
          </div>
        </section>
        
      <Footer />
    </ContentWrapper>
    </main>
  );
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 

