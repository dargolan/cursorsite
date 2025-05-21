import React from 'react';
import { Track, Tag } from '../../types';

interface TrackDetailsProps {
  track: Track;
  onTagClick: (tag: Tag) => void;
  openStemsHandler: () => void;
  isOpen: boolean;
}

export const TrackDetails = ({ track, onTagClick, openStemsHandler, isOpen }: TrackDetailsProps) => {
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
      
      {/* Stems Button (if track has stems) */}
      {track.stems && track.stems.length > 0 && (
        <button
          onClick={openStemsHandler}
          className={`px-4 py-2 rounded-md text-black font-medium ${
            isOpen ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-yellow-300 hover:bg-yellow-400 border border-yellow-500'
          }`}
        >
          {isOpen ? 'Hide Stems' : 'Show Stems'}
        </button>
      )}
    </div>
  );
}; 