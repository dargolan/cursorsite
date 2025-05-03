'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { CartItem as GlobalCartItem } from '../types';

// Replace the CartItem interface with this simplified version
export interface CartItem {
  id: string;
  type: 'track';
  price: number;
  name: string;
  imageUrl: string;
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
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('wavecave_cart');
      if (storedCart) {
        // Convert any old cart format to new format if needed
        const parsedCart = JSON.parse(storedCart);
        const convertedCart = parsedCart.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          type: 'track' // All items are tracks now
        }));
        setItems(convertedCart);
      }
    } catch (err) {
      console.error('Error loading cart from localStorage:', err);
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('wavecave_cart', JSON.stringify(items));
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
    
    // Add the item to the cart
    setItems(prevItems => [
      ...prevItems, 
      item
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