'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import styles from './page.module.css';

// Initialize Stripe with the publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export default function PurchaseStemPage() {
  const [loading, setLoading] = useState(false);
  const [stemId, setStemId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (!stemId.trim()) {
      setError('Please enter a stem ID');
      return;
    }
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stemId,
          email,
        }),
      });

      const session = await response.json();
      
      if (!response.ok) {
        throw new Error(session.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1>Purchase Stem</h1>
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="stemId">Stem ID</label>
            <input
              id="stemId"
              type="text"
              value={stemId}
              onChange={(e) => setStemId(e.target.value)}
              placeholder="Enter the stem ID you want to purchase"
              disabled={loading}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address for the purchase receipt"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Purchase Stem'}
          </button>
        </form>
      </div>
    </div>
  );
} 