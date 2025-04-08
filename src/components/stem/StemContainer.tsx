import React from 'react';
import { Stem, Track } from '../../types';
import { StemItem } from './StemItem';

interface StemContainerProps {
  track: Track;
  isPlaying: boolean;
  isOpen: boolean;
  onAddToCart: (stem: Stem, track: Track) => void;
}

export const StemContainer = ({ track, isPlaying, isOpen, onAddToCart }: StemContainerProps) => {
  // Calculate total stems price and discounted price
  const totalStemsPrice = track.stems?.reduce((sum, stem) => sum + stem.price, 0) || 0;
  const discountedStemsPrice = Math.floor(totalStemsPrice * 0.75 * 100) / 100;
  
  if (!track.stems || track.stems.length === 0) {
    return null;
  }
  
  return (
    <div className={`mt-4 p-4 bg-gray-900 rounded-md transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Stems</h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">
              Individual: ${totalStemsPrice.toFixed(2)}
            </span>
            <button
              onClick={() => track.stems?.forEach(stem => onAddToCart(stem, track))}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md font-medium"
            >
              Buy All: ${discountedStemsPrice.toFixed(2)}
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {track.stems.map(stem => (
            <StemItem
              key={stem.id}
              stem={stem}
              track={track}
              onAddToCart={onAddToCart}
              isPlaying={isPlaying}
              isOpen={isOpen}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 