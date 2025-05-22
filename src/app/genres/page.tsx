'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getTags } from '../../services/strapi';
import { Tag } from '../../types';
import { toCdnUrl } from '../../utils/cdn-url';
import Header from '../../components/Header';
import FilterSidebar from '../../components/FilterSidebar/index';
import ContentWrapper from '../../components/ContentWrapper';

export default function GenresPage() {
  const [genres, setGenres] = useState<Tag[]>([]);
  const [moods, setMoods] = useState<Tag[]>([]);
  const [instruments, setInstruments] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGenres() {
      setLoading(true);
      const tags = await getTags();
      setGenres(tags.filter(tag => tag.type === 'genre'));
      setMoods(tags.filter(tag => tag.type === 'mood'));
      setInstruments(tags.filter(tag => tag.type === 'instrument'));
      setLoading(false);
    }
    fetchGenres();
  }, []);

  // Sidebar props (empty for now, can be enhanced later)
  const sidebarProps = {
    selectedTags: [],
    genres: genres,
    moods: moods,
    instruments: instruments,
    bpmRange: [0, 200] as [number, number],
    durationRange: [0, 600] as [number, number],
    onTagToggle: () => {},
    onBpmChange: () => {},
    onDurationChange: () => {},
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex">
      <FilterSidebar {...sidebarProps} />
      <ContentWrapper>
        <Header />
        <section className="py-8 px-8 bg-[#0A0A0A] pt-24 flex-grow">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <Link href="/" className="text-[#1DF7CE] hover:text-[#1DF7CE]/80 flex items-center text-sm font-medium w-fit mb-2">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Link>
              <h2 className="text-2xl font-bold text-white">All Genres</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gradient-to-b from-[#1E1E1E] to-[#101010] rounded-lg h-48 animate-pulse"></div>
                ))
              ) : genres.length === 0 ? (
                <div className="col-span-full text-center text-gray-400">No genres found.</div>
              ) : (
                genres.map(genre => (
                  <Link key={genre.id} href={`/explore?tags=${genre.id}`} className="relative block overflow-hidden rounded-lg h-48 group">
                    {genre.image?.url ? (
                      <Image
                        src={toCdnUrl(genre.image.url)}
                        alt={genre.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#1E1E1E] to-[#101010]">
                        <svg className="w-12 h-12 text-[#1DF7CE]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M12 12L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="text-white font-bold text-xl mb-1">{genre.name}</h3>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </ContentWrapper>
    </div>
  );
} 