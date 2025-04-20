import React from 'react';
import { Tag } from '../../types';

interface TagButtonProps {
  tag: Tag;
  isSelected: boolean;
  onClick: (tag: Tag) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export default function TagButton({
  tag,
  isSelected,
  onClick,
  size = 'md',
  className = ''
}: TagButtonProps) {
  const sizingClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-3 py-1'
  };
  
  return (
    <button
      className={`font-normal rounded-full mr-1 mb-1 flex items-center ${
        isSelected
          ? 'bg-[#303030] text-[#1DF7CE] border border-[#1DF7CE]'
          : 'bg-[#303030] text-[#CDCDCD] hover:bg-[#474545]'
      } ${sizingClasses[size]} ${className}`}
      onClick={() => onClick(tag)}
      type="button"
    >
      {tag.name}
      {isSelected && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </button>
  );
} 