'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Tag } from '../types';

interface TagSelectorProps {
  category: string;
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  availableTags: Tag[];
}

export default function TagSelector({ category, selectedTags, onChange, availableTags }: TagSelectorProps) {
  const [filter, setFilter] = useState('');
  const [showNoTagsMessage, setShowNoTagsMessage] = useState(false);

  // Only use tags provided from Strapi via availableTags
  const tagsToUse = Array.isArray(availableTags) ? availableTags : [];

  const filteredTags = tagsToUse.filter(tag => 
    tag.name.toLowerCase().includes(filter.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  );

  // Show message if there are no matches and hide after a delay
  useEffect(() => {
    if (filter && filteredTags.length === 0) {
      setShowNoTagsMessage(true);
      const timer = setTimeout(() => setShowNoTagsMessage(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowNoTagsMessage(false);
    }
  }, [filter, filteredTags.length]);

  const handleAddTag = (tag: Tag) => {
    onChange([...selectedTags, tag]);
    setFilter(''); // Clear the filter after adding a tag
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
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-black"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-2 inline-flex items-center justify-center text-black"
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
          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm text-gray-900"
        />

        {/* Show tag suggestions */}
        {filter && filteredTags.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-900"
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
        
        {/* Show message when no matching tags */}
        {showNoTagsMessage && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-4 text-sm text-gray-700">
            No matching {category} tags found
          </div>
        )}
        
        {/* Show message when no tags available */}
        {tagsToUse.length === 0 && (
          <div className="mt-1 text-sm text-amber-600">
            No {category} tags available in Strapi.
          </div>
        )}
      </div>
    </div>
  );
} 