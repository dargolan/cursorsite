import React from 'react';
import { Stem, Track } from '../../types';
import StemItem from './StemItem';
import { useCart } from '@/contexts/CartContext';
import { toCdnUrl } from '../../utils/cdn-url';

interface StemContainerProps {
  track: Track;
  isPlaying: boolean;
  isOpen: boolean;
}

export const StemContainer = ({ track, isPlaying, isOpen }: StemContainerProps) => {
  // Get cart functions from context
  const { addItem } = useCart();
  
  // Calculate total stems price and discounted price
  const totalStemsPrice = track.stems?.reduce((sum, stem) => sum + stem.price, 0) || 0;
  const discountedStemsPrice = Math.floor(totalStemsPrice * 0.75 * 100) / 100;
  
  if (!track.stems || track.stems.length === 0) {
    return null;
  }
  
  // Handle buying all stems with discount
  const handleBuyAllStems = () => {
    track.stems?.forEach(stem => 
      addItem({
        id: stem.id,
        name: stem.name,
        trackName: track.title,
        price: stem.price * 0.75, // Apply 25% discount
        imageUrl: track.imageUrl ? toCdnUrl(track.imageUrl) : '',
        type: 'stem'
      })
    );
  };
  
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
              onClick={handleBuyAllStems}
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 