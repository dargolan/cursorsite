'use client';

import React from 'react';
import { Stem } from '@/types';
import { useCart } from '@/contexts/CartContext';

interface StemListProps {
  stems: Stem[];
  trackTitle: string;
  imageUrl: string;
  playingStemId: string | null;
  onStemPlay: (stemId: string) => void;
  onStemStop: (stemId: string) => void;
}

export function StemList({
  stems,
  trackTitle,
  imageUrl,
  playingStemId,
  onStemPlay,
  onStemStop,
}: StemListProps) {
  const { addItem, removeItem, getItemCount } = useCart();

  const handleStemPlayPause = (stemId: string) => {
    if (playingStemId === stemId) {
      onStemStop(stemId);
    } else {
      onStemPlay(stemId);
    }
  };

  const handleStemAddToCart = (stem: Stem) => {
    addItem({
      id: stem.id,
      type: 'stem',
      price: stem.price,
      name: stem.name,
      trackTitle,
      imageUrl,
    });
  };

  const handleStemRemoveFromCart = (stem: Stem) => {
    removeItem(stem.id);
  };

  return (
    <div className="space-y-4">
      {stems.map((stem) => {
        const isPlaying = playingStemId === stem.id;
        const inCart = getItemCount(stem.id) > 0;

        return (
          <div
            key={stem.id}
            className="flex items-center justify-between p-4 bg-[#232323] rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleStemPlayPause(stem.id)}
                className="p-2 rounded-full bg-[#1DF7CE] hover:bg-[#19d9b6] transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h4v12H6zm8 0h4v12h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                )}
              </button>
              <div>
                <h3 className="font-medium">{stem.name}</h3>
                <p className="text-sm text-gray-400">${stem.price.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => inCart ? handleStemRemoveFromCart(stem) : handleStemAddToCart(stem)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                inCart
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-[#1DF7CE] hover:bg-[#19d9b6] text-black'
              }`}
            >
              {inCart ? 'Remove' : 'Add to Cart'}
            </button>
          </div>
        );
      })}
    </div>
  );
} 