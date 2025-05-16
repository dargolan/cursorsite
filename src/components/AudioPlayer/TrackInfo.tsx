import React from 'react';
import Image from 'next/image';
import { Tag, Track } from '../../types';
import { toCdnUrl } from '../../utils/cdn-url';

interface TrackInfoProps {
  track: Track;
  onTagClick: (tag: Tag) => void;
}

export function TrackInfo({ track, onTagClick }: TrackInfoProps) {
  return (
    <div className="flex space-x-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <Image
          src={track.imageUrl ? toCdnUrl(track.imageUrl) : '/placeholder-image.jpg'}
          alt={track.title}
          fill
          className="object-cover rounded"
        />
      </div>

      <div className="flex-1">
        <h2 className="text-lg font-medium">{track.title}</h2>
        <p className="text-sm text-gray-400">{track.bpm} BPM</p>

        <div className="mt-2 flex flex-wrap gap-2">
          {track.tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => onTagClick(tag)}
              className="px-2 py-1 text-xs bg-[#232323] rounded-full hover:bg-gray-700 transition-colors"
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 