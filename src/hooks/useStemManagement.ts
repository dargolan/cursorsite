import { useState, useCallback } from 'react';
import { getStemUrl } from '../lib/stem-manager';
import { useCart } from '../contexts/CartContext';
import { Stem, CartItem } from '../types';

interface UseStemManagementProps {
  trackTitle: string;
  stems: Stem[];
  trackImageUrl: string;
}

export function useStemManagement({ trackTitle, stems, trackImageUrl }: UseStemManagementProps) {
  const { addItem, removeItem, items } = useCart();
  const [loadingStems, setLoadingStems] = useState<Record<string, boolean>>({});
  const [stemUrls, setStemUrls] = useState<Record<string, string>>({});

  // Handle stem play/pause
  const handleStemPlayPause = useCallback(async (stemId: string) => {
    const stem = stems.find(s => s.id === stemId);
    if (!stem) return;

    setLoadingStems(prev => ({ ...prev, [stemId]: true }));

    try {
      // Get or create URL for the stem
      if (!stemUrls[stemId]) {
        const url = await getStemUrl(stem.name, trackTitle);
        setStemUrls(prev => ({ ...prev, [stemId]: url }));
      }
    } catch (error) {
      console.error('Error loading stem:', error);
    } finally {
      setLoadingStems(prev => ({ ...prev, [stemId]: false }));
    }
  }, [stems, stemUrls, trackTitle]);

  // Handle adding stem to cart
  const handleStemAddToCart = useCallback((stem: Stem) => {
    const cartItem: CartItem = {
      id: stem.id,
      name: stem.name,
      price: stem.price,
      type: 'stem',
      trackTitle,
      imageUrl: trackImageUrl
    };
    addItem(cartItem);
  }, [addItem, trackTitle, trackImageUrl]);

  // Handle removing stem from cart
  const handleStemRemoveFromCart = useCallback((stem: Stem) => {
    removeItem(stem.id);
  }, [removeItem]);

  // Check if stem is in cart
  const isStemInCart = useCallback((stemId: string) => {
    return items.some(item => item.id === stemId);
  }, [items]);

  return {
    loadingStems,
    stemUrls,
    handleStemPlayPause,
    handleStemAddToCart,
    handleStemRemoveFromCart,
    isStemInCart
  };
} 