import React from 'react';
import Image from 'next/image';
import { Track, Tag } from '../types';

interface MusicCardProps {
  track: Track;
  onClick: (track: Track) => void;
  onTagClick: (tag: Tag) => void;
}

export default function MusicCard({ track, onClick, onTagClick }: MusicCardProps) {
  // Format duration (e.g., 2:30)
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden transition-transform hover:scale-[1.02] duration-200">
      {/* Track Image */}
      <div className="relative w-full h-48 bg-gray-900 flex items-center justify-center cursor-pointer" onClick={() => onClick(track)}>
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

      {/* Track Details */}
      <div className="p-4">
        <h3 className="text-white font-medium text-lg mb-1">{track.title}</h3>
        
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-400">
            {formatDuration(track.duration)} • {track.bpm} BPM
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {track.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag.id}
              className="px-2 py-0.5 bg-[#282828] text-gray-300 text-xs rounded-full cursor-pointer hover:bg-[#333]"
              onClick={() => onTagClick(tag)}
            >
              {tag.name}
            </span>
          ))}
          {track.tags.length > 3 && (
            <span className="text-xs text-gray-400">+{track.tags.length - 3} more</span>
          )}
        </div>
      </div>
    </div>
  );
} 