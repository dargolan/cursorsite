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
  
  // Use a consistent ID format for both adding and removing
  const cartItemId = `stem_${stem.id}`;
  
  // Check if item is already in cart
  const existingItemIndex = cart.findIndex(item => item.id === cartItemId);
  
  if (existingItemIndex === -1) {
    // Add new item
    cart.push({
      id: cartItemId,
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

/**
 * Add a bundle of stems to the cart with a discount
 */
export function addStemBundle(stems: Stem[], track: Track): void {
  if (typeof window === 'undefined' || !stems.length) {
    return;
  }
  
  const cart = getCart();
  
  // Remove any individual stems from this track that might be in the cart
  const filteredCart = cart.filter(item => {
    const stemPrefix = 'stem_';
    // Keep items that are not stems from this track
    return !(item.id.startsWith(stemPrefix) && item.trackTitle === track.title);
  });
  
  // Calculate the total price and apply discount
  const totalPrice = stems.reduce((sum, stem) => sum + (stem.price || 0), 0);
  const discountedPrice = Math.floor(totalPrice * 0.75 * 100) / 100;
  
  // Add the bundle as a single cart item
  filteredCart.push({
    id: `bundle_${track.id}`,
    type: 'stem_bundle',
    price: discountedPrice,
    name: `${stems.length} Stems Bundle`,
    trackTitle: track.title,
    imageUrl: track.imageUrl
  });
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filteredCart));
}

/**
 * Check if a stem bundle is in the cart
 */
export function isStemBundleInCart(trackId: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const cart = getCart();
  return cart.some(item => item.id === `bundle_${trackId}`);
}

/**
 * Remove a stem bundle from the cart
 */
export function removeStemBundle(trackId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const cart = getCart();
  const updatedCart = cart.filter(item => item.id !== `bundle_${trackId}`);
  
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
} 