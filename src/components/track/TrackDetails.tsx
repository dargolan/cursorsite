import React from 'react';
import { Track, Tag } from '../../types';

interface TrackDetailsProps {
  track: Track;
  onTagClick: (tag: Tag) => void;
}

export const TrackDetails = ({ track, onTagClick }: TrackDetailsProps) => {
  return (
    <div className="flex flex-col">
      {/* Track Title */}
      <h2 className="text-xl font-bold text-white mb-2">{track.title}</h2>
      
      {/* Track Metadata */}
      <div className="flex flex-wrap items-center text-gray-400 text-sm mb-3">
        <span className="mr-4">{track.bpm} BPM</span>
        <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {track.tags && track.tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => onTagClick(tag)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm text-gray-300"
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}; 