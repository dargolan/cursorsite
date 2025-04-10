// Compatibility layer for older code using direct cart functions
// This file uses the CartContext internally and will be deprecated
// New code should use the CartContext directly via useCart() hook

import { CartItem, Stem, Track } from '../types';

/**
 * @deprecated Use CartContext instead via useCart() hook
 * 
 * NOTICE: This cart implementation is deprecated and will be removed in a future version
 * Please use the CartContext via useCart() hook from @/contexts/CartContext instead
 */

// Helper to access localStorage or trigger a warning
const accessLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  console.warn('Using deprecated cart API - please migrate to useCart() from CartContext');
  return window.localStorage;
};

// Local storage key compatibility
const CART_STORAGE_KEY = 'wavecave_cart';

/**
 * Get the current cart from localStorage
 * @deprecated Use useCart() hook instead
 */
export function getCart(): CartItem[] {
  const localStorage = accessLocalStorage();
  if (!localStorage) {
    return [];
  }
  
  const cartJson = localStorage.getItem(CART_STORAGE_KEY);
  return cartJson ? JSON.parse(cartJson) : [];
}

/**
 * Add a stem to the cart
 * @deprecated Use useCart() hook instead
 */
export function addToCart(stem: Stem, track: Track): void {
  const localStorage = accessLocalStorage();
  if (!localStorage) {
    return;
  }
  
  const cart = getCart();
  
  // Check if item is already in cart
  const existingItemIndex = cart.findIndex(item => item.id === stem.id && item.type === 'stem');
  
  if (existingItemIndex === -1) {
    // Add new item
    cart.push({
      id: stem.id,
      type: 'stem',
      price: stem.price,
      name: stem.name,
      trackTitle: track.title,
      imageUrl: track.imageUrl
    });
    
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    
    // Trigger a storage event for other components using CartContext
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * Remove a stem from the cart
 * @deprecated Use useCart() hook instead
 */
export function removeFromCart(itemId: string): void {
  const localStorage = accessLocalStorage();
  if (!localStorage) {
    return;
  }
  
  const cart = getCart();
  const updatedCart = cart.filter(item => item.id !== itemId);
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
  
  // Trigger a storage event for other components using CartContext
  window.dispatchEvent(new Event('storage'));
}

/**
 * Clear the entire cart
 * @deprecated Use useCart() hook instead
 */
export function clearCart(): void {
  const localStorage = accessLocalStorage();
  if (!localStorage) {
    return;
  }
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
  
  // Trigger a storage event for other components using CartContext
  window.dispatchEvent(new Event('storage'));
}

/**
 * Calculate the total price of items in the cart
 * @deprecated Use useCart() hook instead
 */
export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price, 0);
}

/**
 * Get the number of items in the cart
 * @deprecated Use useCart() hook instead
 */
export function getCartCount(): number {
  return getCart().length;
} 
  const updatedCart = cart.filter(item => item.id !== itemId);
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
  
  // Trigger a storage event for other components using CartContext
  window.dispatchEvent(new Event('storage'));
}

/**
 * Clear the entire cart
 * @deprecated Use useCart() hook instead
 */
export function clearCart(): void {
  const localStorage = accessLocalStorage();
  if (!localStorage) {
    return;
  }
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
  
  // Trigger a storage event for other components using CartContext
  window.dispatchEvent(new Event('storage'));
}

/**
 * Calculate the total price of items in the cart
 * @deprecated Use useCart() hook instead
 */
export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price, 0);
}

/**
 * Get the number of items in the cart
 * @deprecated Use useCart() hook instead
 */
export function getCartCount(): number {
  return getCart().length;
} 