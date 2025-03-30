import { CartItem, Stem, Track } from '../types';

// Local storage key for cart
const CART_STORAGE_KEY = 'music_library_cart';

/**
 * Get the current cart from localStorage
 */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const cartJson = localStorage.getItem(CART_STORAGE_KEY);
  return cartJson ? JSON.parse(cartJson) : [];
}

/**
 * Add a stem to the cart
 */
export function addToCart(stem: Stem, track: Track): void {
  if (typeof window === 'undefined') {
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
  }
}

/**
 * Remove a stem from the cart
 */
export function removeFromCart(itemId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const cart = getCart();
  const updatedCart = cart.filter(item => item.id !== itemId);
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
}

/**
 * Clear the entire cart
 */
export function clearCart(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
}

/**
 * Calculate the total price of items in the cart
 */
export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price, 0);
}

/**
 * Get the number of items in the cart
 */
export function getCartCount(): number {
  return getCart().length;
} 