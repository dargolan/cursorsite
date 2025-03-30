'use client';

import React from 'react';
import { Tag } from '../types';

interface TagFilterProps {
  tag: Tag;
  selected: boolean;
  onClick: () => void;
}

export default function TagFilter({
  tag,
  selected,
  onClick
}: TagFilterProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1 text-xs font-normal px-3 py-1 rounded-full transition-colors ${
        selected 
          ? 'bg-[#303030] text-[#1DF7CE] border border-[#1DF7CE]' 
          : 'border border-[#474545] text-[#CDCDCD] hover:border-[#1DF7CE] hover:text-[#1DF7CE]'
      }`}
    >
      <span>{tag.name}</span>
      {selected && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
} 