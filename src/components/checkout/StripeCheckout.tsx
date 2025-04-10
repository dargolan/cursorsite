'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StripeCheckoutProps {
  stemId: string;
  stemName: string;
  trackId: string;
  trackName: string;
  price: number;
  buttonText?: string;
  userId?: string;
}

export default function StripeCheckout({
  stemId,
  stemName,
  trackId,
  trackName,
  price,
  buttonText = 'Purchase',
  userId
}: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call our API to create a checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stemId,
          trackId,
          userId,
          stemName,
          trackName,
          price: price * 100, // Convert to cents for Stripe
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
    <div className="stripe-checkout">
      {error && (
        <div className="text-red-500 mb-3 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md 
                    transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Processing...' : buttonText}
      </button>
    </div>
  );
} 