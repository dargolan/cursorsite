'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

interface StripeCheckoutProps {
  trackId: string;
  trackName: string;
  price: number;
  className?: string;
  buttonText?: string;
}

// Initialize Stripe with your public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '');

export function StripeCheckout({
  trackId,
  trackName,
  price,
  className = '',
  buttonText = 'Buy Now'
}: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: trackId,
              name: trackName,
              price,
              type: 'track'
            }
          ]
        }),
      });

      const { sessionId } = await response.json();

      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });

      if (error) {
        setError(error.message || 'Failed to redirect to checkout');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="text-red-500 mb-2 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`flex items-center justify-center rounded-md px-4 py-2 
          bg-[#6772E5] text-white hover:bg-[#5469D4] transition-colors
          ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      >
        {isLoading ? 'Processing...' : buttonText}
      </button>
    </div>
  );
} 