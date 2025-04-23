'use client';

import React, { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

// Tag data by category
const PREDEFINED_TAGS = {
  genre: [
    'Hip Hop', 'R&B', 'Pop', 'Electronic', 'Rock', 'Jazz', 'Lo-Fi', 
    'Trap', 'House', 'Ambient', 'Funk', 'Soul', 'EDM', 'Classical'
  ],
  mood: [
    'Chill', 'Energetic', 'Happy', 'Sad', 'Aggressive', 'Relaxed', 
    'Dark', 'Uplifting', 'Dreamy', 'Inspirational', 'Playful', 'Serious'
  ],
  instrument: [
    'Piano', 'Guitar', 'Drums', 'Bass', 'Synth', 'Vocals', 'Strings',
    'Brass', 'Woodwinds', 'Percussion', 'Electric Guitar', 'Acoustic Guitar',
    'Keyboard', 'Saxophone', 'Trumpet'
  ]
};

interface TagSelectorProps {
  category: 'genre' | 'mood' | 'instrument';
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  allowCustomTags?: boolean;
}

export default function TagSelector({ 
  category, 
  selectedTags, 
  onChange, 
  maxTags = 5,
  allowCustomTags = true 
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [filterText, setFilterText] = useState('');
  
  const availableTags = PREDEFINED_TAGS[category] || [];
  
  const filteredTags = filterText 
    ? availableTags.filter(tag => 
        tag.toLowerCase().includes(filterText.toLowerCase()) && 
        !selectedTags.includes(tag)
      )
    : availableTags.filter(tag => !selectedTags.includes(tag));

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onChange(newTags);
  };

  const handleAddTag = (tagToAdd: string) => {
    if (selectedTags.length >= maxTags) {
      return;
    }
    
    if (selectedTags.includes(tagToAdd)) {
      return;
    }
    
    const newTags = [...selectedTags, tagToAdd];
    onChange(newTags);
    setFilterText('');
    setInputValue('');
    setIsAddingTag(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue.trim());
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setInputValue('');
      setFilterText('');
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <div 
            key={tag} 
            className="bg-accent/10 text-gray-800 rounded-full px-3 py-1 text-sm flex items-center"
          >
            <span>{tag}</span>
            <button 
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        {selectedTags.length < maxTags && (
          isAddingTag ? (
            <div className="relative">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Type to filter or add"
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
              />
              {filteredTags.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-48 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-md shadow-md z-10">
                  {filteredTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              {allowCustomTags && filterText && !filteredTags.includes(filterText) && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-md z-10">
                  <button
                    type="button"
                    onClick={() => handleAddTag(filterText)}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-green-700 font-medium"
                  >
                    + Add "{filterText}"
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="border border-gray-300 rounded-full px-3 py-1 text-sm text-gray-500 flex items-center hover:bg-gray-50"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add {category}
            </button>
          )
        )}
      </div>
      
      {selectedTags.length >= maxTags && (
        <p className="text-xs text-gray-500 italic">
          Maximum of {maxTags} tags reached
        </p>
      )}
    </div>
  );
} 