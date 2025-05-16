import React from 'react';
import Image from 'next/image';
import { Track } from '../../types';
import { toCdnUrl } from '../../utils/cdn-url';

interface TrackImageProps {
  track: Track;
  isPlaying: boolean;
  onClick: () => void;
}

export const TrackImage = ({ track, isPlaying, onClick }: TrackImageProps) => {
  return (
    <div 
      className="relative group cursor-pointer rounded-md overflow-hidden" 
      onClick={onClick}
      style={{ aspectRatio: '1/1' }}
    >
      {/* Track Image */}
      <div className="w-full h-full relative">
        <Image
          src={track.imageUrl ? toCdnUrl(track.imageUrl) : '/placeholder-image.jpg'}
          alt={`${track.title} cover`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-80' : 'group-hover:opacity-80'}`}
        />
      </div>
      
      {/* Play/Pause Overlay */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying || true ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="bg-black bg-opacity-50 rounded-full p-4">
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}; 