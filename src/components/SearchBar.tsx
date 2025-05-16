'use client';

import React, { useState, useRef } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  existingSearch?: string; // Add prop for existing search terms
}

export default function SearchBar({ onSearch, existingSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
      setQuery(''); // Clear the input after submitting
      
      // Focus the input again to allow for quick multiple searches
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Determine placeholder text based on whether we already have search terms
  const placeholderText = existingSearch 
    ? "Add another search term..."
    : "Search";

  return (
    <div className="mb-6">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg 
              className="w-5 h-5 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="search"
            id="search"
            className="block w-full py-2 pl-12 pr-4 text-base rounded-full bg-[#1E1E1E] border border-[#CDCDCD] text-white focus:outline-none focus:ring-1 focus:ring-[#1DF7CE]"
            placeholder={placeholderText}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-4 flex items-center"
            >
              <svg
                className="w-5 h-5 text-[#1DF7CE]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>
      {existingSearch && (
        <p className="text-[11px] text-gray-400 mt-1 pl-4">
          Press Enter to add multiple search terms
        </p>
      )}
    </div>
  );
} 