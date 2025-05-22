'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/Header';

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
    <div className="bg-[#121212] min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10 bg-[#1E1E1E] min-h-screen rounded-xl shadow-lg mt-16">
        <h1 className="text-3xl font-bold mb-8 text-white">Checkout</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-400 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-4">Your cart is empty</p>
            <Link 
              href="/explore" 
              className="inline-block bg-[#1DF7CE] hover:bg-[#19d4b1] text-black font-medium py-2 px-6 rounded-md transition-all shadow-md"
            >
              Browse Tracks
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-[#232323] rounded-lg shadow-md overflow-hidden mb-8">
              <ul>
                {cartItems.map((item) => (
                  <li key={item.id} className="flex justify-between items-center py-5 px-8 border-b border-[#282828] last:border-b-0">
                    <div className="flex items-center w-2/5">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="group p-2 mr-3 rounded-full hover:bg-[#282828] transition-colors"
                        aria-label="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:text-[#1DF7CE] transition-colors" viewBox="0 0 24 24" fill="none">
                          <path d="M6 7V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 7V5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {item.imageUrl && (
                        <div className="h-14 w-14 mr-4 relative flex-shrink-0">
                          <Image 
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover rounded-md border border-[#333]"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-[#CDCDCD]">{item.trackName}</p>
                      </div>
                    </div>
                    <div className="w-1/5 text-right text-[#1DF7CE] font-medium ml-auto">
                      {item.price.toFixed(2)}€
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-6 px-8 bg-[#232323] rounded-lg mb-8">
              <span className="font-bold text-white text-lg">Total:</span>
              <span className="font-bold text-2xl text-[#1DF7CE]">{totalAmount.toFixed(2)}€</span>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
              <Link 
                href="/explore"
                className="bg-[#232323] hover:bg-[#282828] text-[#CDCDCD] py-2 px-6 rounded-full transition-all border border-[#333] font-medium shadow-sm"
              >
                Continue Shopping
              </Link>
              <button
                onClick={handleCheckout}
                disabled={isLoading || cartItems.length === 0}
                className={`bg-[#1DF7CE] hover:bg-[#19d4b1] text-black py-2 px-6 rounded-full font-semibold transition-all shadow-md ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 