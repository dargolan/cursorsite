'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getTracks, getTags } from '../services/strapi';
import { Track, Tag } from '../types';

export default function HomePage() {
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [genres, setGenres] = useState<Tag[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const tracks = await getTracks();
        // Get featured tracks (limit to 4)
        setFeaturedTracks(tracks?.slice(0, 4) || []);
        
        const tags = await getTags();
        // Filter out genre tags and get the top ones
        const genreTags = tags
          ?.filter(tag => tag.type === 'genre')
          ?.sort((a, b) => (b.count || 0) - (a.count || 0))
          ?.slice(0, 4) || [];
        setGenres(genreTags);
      } catch (error) {
        console.error('Error fetching data:', error);
        setFeaturedTracks([]);
        setGenres([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-[#121212] text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative w-full px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-8">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Discover the <span className="text-[#1DF7CE]">Soundtrack</span> to Your <span className="text-[#1DF7CE]">Story</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              High-quality, royalty-free music for your creative projects
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative w-full sm:w-96">
                <input 
                  type="text" 
                  placeholder="Search tracks..." 
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1DF7CE] focus:border-transparent" 
                />
                <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Link href="/explore" className="flex items-center justify-center px-6 py-3 bg-[#1DF7CE] hover:bg-opacity-80 text-black font-medium rounded-md transition duration-200">
                Browse Library
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/2 relative">
            <Image
              src="/images/studio.jpg"
              alt="Recording studio"
              width={700}
              height={500}
              className="rounded-lg shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>
      
      {/* Featured Tracks Section */}
      <section className="py-16 px-4 bg-[#121212]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Featured Tracks</h2>
            <Link href="/explore" className="text-[#1DF7CE] hover:underline flex items-center">
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
                      <Image
                        src={track.imageUrl}
                        alt={track.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#282828] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#1DF7CE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-medium text-lg mb-1">{track.title}</h3>
                    <p className="text-gray-400 text-sm">{track.tags[0]?.name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-gray-400 text-sm">{formatDuration(track.duration)} • {track.tags[0]?.name}</span>
                      <button className="text-white hover:text-[#1DF7CE]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* Browse by Genre Section */}
      <section className="py-16 px-4 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">Browse by Genre</h2>
            <Link href="/genres" className="text-[#1DF7CE] hover:underline flex items-center">
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
      <section className="py-16 px-4 bg-[#121212]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Featured Projects</h2>
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
                  <button className="flex items-center text-[#1DF7CE] hover:underline">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                    Watch Project
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/submit-project" className="inline-flex items-center px-6 py-3 border border-[#1DF7CE] text-[#1DF7CE] hover:bg-[#1DF7CE]/10 rounded-md font-medium transition duration-200">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Submit Your Project
            </Link>
          </div>
        </div>
      </section>
      
      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay in the Loop</h2>
          <p className="text-gray-300 mb-8">Subscribe to get the latest updates on new tracks and exclusive offers</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full sm:w-96 px-4 py-3 bg-[#1E1E1E] border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#1DF7CE] focus:border-transparent" 
            />
            <button className="w-full sm:w-auto whitespace-nowrap px-6 py-3 bg-[#1DF7CE] hover:bg-opacity-80 text-black font-medium rounded-md transition duration-200">
              Subscribe
            </button>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 

