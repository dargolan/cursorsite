'use client';

import React from 'react';
import { Tag } from '../types';

interface TagFilterProps {
  selectedTags: Tag[];
  onRemoveTag: (tagId: string) => void;
  onClearAllTags: () => void;
}

export default function TagFilter({
  selectedTags,
  onRemoveTag,
  onClearAllTags
}: TagFilterProps): React.ReactElement | null {
  if (selectedTags.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      <h3 className="text-white font-normal text-xs mb-2">Active Filters</h3>
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <button
            key={tag.id}
            onClick={() => onRemoveTag(tag.id)}
            className="flex items-center space-x-1 border border-[#474545] hover:border-[#1DF7CE] text-[#CDCDCD] hover:text-[#1DF7CE] text-xs font-normal px-3 py-1 rounded-full transition-colors"
          >
            <span>{tag.name}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ))}
        
        {selectedTags.length > 0 && (
          <button
            onClick={onClearAllTags}
            className="text-[#CDCDCD] hover:text-[#1DF7CE] text-xs font-normal underline ml-2"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
} 