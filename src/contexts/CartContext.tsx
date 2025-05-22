'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { CartItem as GlobalCartItem } from '../types';

// Extending the CartItem from types.ts but making the type field optional with a default
interface CartItem extends Omit<GlobalCartItem, 'type' | 'trackTitle'> {
  type?: 'track' | 'stem';
  trackName: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

// Create the context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  getItemCount: () => 0,
  getTotalPrice: () => 0,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('wavecave_cart');
      if (process.env.NODE_ENV === 'development') {
        console.log('Loaded cart from localStorage:', storedCart);
      }
      if (storedCart) {
        // Convert any old cart format to new format if needed
        const parsedCart = JSON.parse(storedCart);
        const convertedCart = parsedCart.map((item: any) => ({
          id: item.id,
          name: item.name,
          trackName: item.trackName || item.trackTitle || '', // Support both properties
          price: item.price,
          imageUrl: item.imageUrl,
          type: item.type || 'stem' // Default to stem if not specified
        }));
        setItems(convertedCart);
      }
    } catch (err) {
      console.error('Error loading cart from localStorage:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('wavecave_cart', JSON.stringify(items));
      if (process.env.NODE_ENV === 'development') {
        console.log('Saved cart to localStorage:', items);
      }
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }, [items]);
  
  const addItem = (item: CartItem) => {
    // Check if the item is already in the cart
    const existingItemIndex = items.findIndex(i => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      // Item already in cart - could update quantity if needed
      // For now, we'll just skip adding it again
      return;
    }
    
    // Add the item to the cart with default type if not specified
    setItems(prevItems => [
      ...prevItems, 
      {
        ...item,
        type: item.type || 'stem'
      }
    ]);
  };
  
  const removeItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  
  const clearCart = () => {
    setItems([]);
  };
  
  const getItemCount = () => {
    return items.length;
  };
  
  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price, 0);
  };
  
  if (!isLoaded) return null;
  
  return (
    <CartContext.Provider 
      value={{ 
        items, 
        addItem, 
        removeItem, 
        clearCart, 
        getItemCount, 
        getTotalPrice 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext); 