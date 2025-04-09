import React, { useState, useEffect } from 'react';
import { Stem, Track } from '../../types';
import { StemItem } from './StemItem';
import { isStemBundleInCart } from '../../services/cart';

interface StemContainerProps {
  track: Track;
  isPlaying: boolean;
  isOpen: boolean;
  onAddToCart: (stem: Stem, track: Track) => void;
  onAddStemBundle?: (stems: Stem[], track: Track) => void;
  onRemoveStemBundle?: (trackId: string) => void;
}

export const StemContainer = ({
  track,
  isPlaying,
  isOpen,
  onAddToCart,
  onAddStemBundle,
  onRemoveStemBundle
}: StemContainerProps) => {
  // Calculate total stems price and discounted price
  const totalStemsPrice = track.stems?.reduce((sum, stem) => sum + (stem.price || 0), 0) || 0;
  const discountedStemsPrice = Math.floor(totalStemsPrice * 0.75 * 100) / 100;
  
  // Track whether the bundle is in the cart
  const [bundleInCart, setBundleInCart] = useState(false);
  
  // Check if the bundle is in the cart on load and when cart changes
  useEffect(() => {
    setBundleInCart(isStemBundleInCart(track.id));
    
    // Listen for storage events to update state when cart changes in another tab
    const handleStorageChange = () => {
      setBundleInCart(isStemBundleInCart(track.id));
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [track.id]);
  
  if (!track.stems || track.stems.length === 0) {
    return null;
  }
  
  const handleBundleAction = () => {
    if (bundleInCart) {
      // Remove bundle
      if (onRemoveStemBundle) {
        onRemoveStemBundle(track.id);
        setBundleInCart(false);
      }
    } else {
      // Add bundle
      if (onAddStemBundle && track.stems) {
        onAddStemBundle(track.stems, track);
        setBundleInCart(true);
      } else if (track.stems) {
        // Fall back to adding individual stems
        track.stems.forEach(stem => onAddToCart(stem, track));
        setBundleInCart(true);
      }
    }
  };
  
  return (
    <div className={`mt-4 p-4 bg-gray-900 rounded-md transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Stems</h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">
              Individual: €{totalStemsPrice.toFixed(2)}
            </span>
            <button
              onClick={handleBundleAction}
              className={`px-3 py-1 rounded-md font-medium ${
                bundleInCart 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {bundleInCart ? 'Remove All' : `Buy All: €${discountedStemsPrice.toFixed(2)}`}
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