'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';

export default function CheckoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items: cartItems, removeItem, getTotalPrice } = useCart();
  const router = useRouter();

  const totalAmount = getTotalPrice();

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call our API to create a checkout session with all items
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            stemId: item.id,
            stemName: item.name,
            trackName: item.trackName,
            price: item.price * 100, // Convert to cents for Stripe
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to initiate checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link 
            href="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Browse Tracks
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="border-b pb-2 pt-4 px-6 font-medium text-gray-700 flex justify-between">
              <span className="w-2/5">Item</span>
              <span className="w-1/5 text-right">Price</span>
              <span className="w-1/5 text-right">Action</span>
            </div>
            <ul className="divide-y">
              {cartItems.map((item) => (
                <li key={item.id} className="flex justify-between items-center py-4 px-6">
                  <div className="flex items-center w-2/5">
                    {item.imageUrl && (
                      <div className="h-12 w-12 mr-3 relative">
                        <Image 
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.trackName}</p>
                    </div>
                  </div>
                  <div className="w-1/5 text-right">
                    {item.price.toFixed(2)}€
                  </div>
                  <div className="w-1/5 text-right">
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-between items-center py-4 px-6 bg-gray-50 rounded-lg mb-6">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-xl">{totalAmount.toFixed(2)}€</span>
          </div>
          
          <div className="flex justify-between">
            <Link 
              href="/"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-md transition-colors"
            >
              Continue Shopping
            </Link>
            
            <button
              onClick={handleCheckout}
              disabled={isLoading || cartItems.length === 0}
              className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md 
                        transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </>
      )}
    </div>
  );
} 