'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Tag } from '../types';

// Tag data by category
const PREDEFINED_TAGS: Record<'genre' | 'mood' | 'instrument', Tag[]> = {
  genre: [
    { id: 'hiphop', name: 'Hip Hop', type: 'genre' },
    { id: 'rnb', name: 'R&B', type: 'genre' },
    { id: 'pop', name: 'Pop', type: 'genre' },
    { id: 'electronic', name: 'Electronic', type: 'genre' },
    { id: 'rock', name: 'Rock', type: 'genre' },
    { id: 'jazz', name: 'Jazz', type: 'genre' },
    { id: 'lofi', name: 'Lo-Fi', type: 'genre' },
    { id: 'trap', name: 'Trap', type: 'genre' },
    { id: 'house', name: 'House', type: 'genre' },
    { id: 'ambient', name: 'Ambient', type: 'genre' },
    { id: 'funk', name: 'Funk', type: 'genre' },
    { id: 'soul', name: 'Soul', type: 'genre' },
    { id: 'edm', name: 'EDM', type: 'genre' },
    { id: 'classical', name: 'Classical', type: 'genre' },
  ],
  mood: [
    { id: 'chill', name: 'Chill', type: 'mood' },
    { id: 'energetic', name: 'Energetic', type: 'mood' },
    { id: 'happy', name: 'Happy', type: 'mood' },
    { id: 'sad', name: 'Sad', type: 'mood' },
    { id: 'aggressive', name: 'Aggressive', type: 'mood' },
    { id: 'relaxed', name: 'Relaxed', type: 'mood' },
    { id: 'dark', name: 'Dark', type: 'mood' },
    { id: 'uplifting', name: 'Uplifting', type: 'mood' },
    { id: 'dreamy', name: 'Dreamy', type: 'mood' },
    { id: 'inspirational', name: 'Inspirational', type: 'mood' },
    { id: 'playful', name: 'Playful', type: 'mood' },
    { id: 'serious', name: 'Serious', type: 'mood' },
  ],
  instrument: [
    { id: 'piano', name: 'Piano', type: 'instrument' },
    { id: 'guitar', name: 'Guitar', type: 'instrument' },
    { id: 'drums', name: 'Drums', type: 'instrument' },
    { id: 'bass', name: 'Bass', type: 'instrument' },
    { id: 'synth', name: 'Synth', type: 'instrument' },
    { id: 'vocals', name: 'Vocals', type: 'instrument' },
    { id: 'strings', name: 'Strings', type: 'instrument' },
    { id: 'brass', name: 'Brass', type: 'instrument' },
    { id: 'woodwinds', name: 'Woodwinds', type: 'instrument' },
    { id: 'percussion', name: 'Percussion', type: 'instrument' },
    { id: 'electricguitar', name: 'Electric Guitar', type: 'instrument' },
    { id: 'acousticguitar', name: 'Acoustic Guitar', type: 'instrument' },
    { id: 'keyboard', name: 'Keyboard', type: 'instrument' },
    { id: 'saxophone', name: 'Saxophone', type: 'instrument' },
    { id: 'trumpet', name: 'Trumpet', type: 'instrument' },
  ],
};

interface TagSelectorProps {
  category: string;
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  availableTags: Tag[];
}

export default function TagSelector({ category, selectedTags, onChange, availableTags }: TagSelectorProps) {
  const [filter, setFilter] = useState('');

  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(filter.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  );

  const handleAddTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    onChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-white"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-2 inline-flex items-center justify-center"
            >
              <span className="sr-only">Remove {tag.name}</span>
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`Search ${category} tags...`}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm"
        />

        {filter && filteredTags.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 