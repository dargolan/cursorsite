'use client';

import React from 'react';
import { useCart } from '../../contexts/CartContext';

interface AddToCartButtonProps {
  trackId: string;
  trackName: string;
  price: number;
  imageUrl: string;
  className?: string;
}

export function AddToCartButton({ 
  trackId,
  trackName,
  price,
  imageUrl,
  className = ''
}: AddToCartButtonProps) {
  const { items, addItem, removeItem } = useCart();
  
  // Check if item is already in cart
  const isInCart = items.some(item => item.id === trackId);
  
  const handleToggleCart = () => {
    if (isInCart) {
      removeItem(trackId);
    } else {
      addItem({
        id: trackId,
        name: trackName,
        price,
        type: 'track',
        imageUrl
      });
    }
  };
  
  return (
    <button
      onClick={handleToggleCart}
      className={`flex items-center justify-center rounded-md px-4 py-2 
        ${isInCart 
          ? 'bg-gray-600 hover:bg-gray-700' 
          : 'bg-[#1DF7CE] text-black hover:bg-[#18e0bb]'
        } transition-colors ${className}`}
    >
      {isInCart ? (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Remove from Cart
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Add to Cart
        </>
      )}
    </button>
  );
} 