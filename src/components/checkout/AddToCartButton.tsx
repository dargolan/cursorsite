'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';

interface AddToCartButtonProps {
  stemId: string;
  stemName: string;
  trackName: string;
  price: number;
  imageUrl?: string;
  className?: string;
  buttonText?: string;
  onAdded?: () => void;
}

export default function AddToCartButton({
  stemId,
  stemName,
  trackName,
  price,
  imageUrl,
  className = '',
  buttonText = 'Add to Cart',
  onAdded
}: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // Check if item is already in cart
  const isInCart = items.some(item => item.id === stemId);

  const handleAddToCart = () => {
    if (isInCart) return;
    
    addItem({
      id: stemId,
      name: stemName,
      trackName,
      price,
      imageUrl
    });
    
    setIsAdded(true);
    
    // Reset "Added" state after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
    
    if (onAdded) {
      onAdded();
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isInCart}
      className={`${className} ${
        isInCart 
          ? 'bg-gray-400 cursor-not-allowed' 
          : isAdded 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-blue-600 hover:bg-blue-700'
      } text-white font-medium py-2 px-4 rounded-md transition-colors`}
    >
      {isInCart ? 'In Cart' : isAdded ? 'Added!' : buttonText}
    </button>
  );
} 