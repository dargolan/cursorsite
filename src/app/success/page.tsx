'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DownloadButton from '@/components/checkout/DownloadButton';

interface PurchaseDetails {
  stemId: string;
  stemName: string;
  trackId: string;
  trackName: string;
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [purchasedItems, setPurchasedItems] = useState<PurchaseDetails[]>([]);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID provided');
      return;
    }

    // Clear the cart from localStorage after successful purchase
    try {
      localStorage.removeItem('wavecave_cart');
    } catch (err) {
      console.error('Error clearing cart:', err);
    }

    // Verify the purchase was successful and get purchase details
    const verifyPurchase = async () => {
      try {
        const response = await fetch(`/api/verify-purchase?session_id=${sessionId}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Thank you for your purchase!');
          
          // Extract purchase details if available
          if (data.session && data.session.metadata) {
            const metadata = data.session.metadata;
            
            // Check if it's a single stem or multiple stems
            if (metadata.stemId) {
              // Single stem purchase
              await fetchStemDetails(metadata.stemId, metadata.trackId);
            } else if (metadata.stemIds) {
              // Multiple stem purchase
              const stemIds = metadata.stemIds.split(',');
              await fetchMultipleStemDetails(stemIds);
            }
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify purchase');
        }
      } catch (error) {
        console.error('Error verifying purchase:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    verifyPurchase();
  }, [sessionId, router]);

  const fetchStemDetails = async (stemId: string, trackId?: string) => {
    try {
      const stemResponse = await fetch(`/api/stems/${stemId}`);
      if (!stemResponse.ok) {
        throw new Error('Failed to fetch stem details');
      }
      
      const stemData = await stemResponse.json();
      
      setPurchasedItems([{
        stemId,
        stemName: stemData.name || 'Purchased Stem',
        trackId: trackId || stemData.trackId || '',
        trackName: stemData.trackName || '',
      }]);
    } catch (err) {
      console.error('Error fetching stem details:', err);
      setPurchasedItems([{
        stemId,
        stemName: 'Purchased Stem',
        trackId: trackId || '',
        trackName: '',
      }]);
    }
  };

  const fetchMultipleStemDetails = async (stemIds: string[]) => {
    try {
      const items: PurchaseDetails[] = [];
      
      for (const stemId of stemIds) {
        try {
          const stemResponse = await fetch(`/api/stems/${stemId}`);
          const stemData = await stemResponse.json();
          
          if (stemResponse.ok) {
            items.push({
              stemId,
              stemName: stemData.name || `Stem ${stemId}`,
              trackId: stemData.trackId || '',
              trackName: stemData.trackName || '',
            });
          } else {
            items.push({
              stemId,
              stemName: `Stem ${stemId}`,
              trackId: '',
              trackName: '',
            });
          }
        } catch (err) {
          console.error(`Error fetching details for stem ${stemId}:`, err);
          items.push({
            stemId,
            stemName: `Stem ${stemId}`,
            trackId: '',
            trackName: '',
          });
        }
      }
      
      setPurchasedItems(items);
    } catch (err) {
      console.error('Error fetching multiple stem details:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {status === 'loading' ? 'Processing your order...' : 
           status === 'success' ? 'Thank you for your purchase!' : 
           'Oops! Something went wrong'}
        </h1>
        
        {status === 'loading' && (
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="mb-4 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="mb-6">{message}</p>
            
            {/* Download buttons for purchased stems */}
            {purchasedItems.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-gray-600">
                  {purchasedItems.length === 1 
                    ? "Your stem is ready for download:" 
                    : "Your stems are ready for download:"}
                </p>
                
                <div className="space-y-3">
                  {purchasedItems.map((item) => (
                    <div key={item.stemId} className="p-3 border rounded-lg bg-gray-50">
                      <p className="font-medium mb-2">
                        {item.stemName}
                        {item.trackName && <span className="text-sm text-gray-500 ml-1">({item.trackName})</span>}
                      </p>
                      <DownloadButton 
                        stemId={item.stemId}
                        stemName={item.stemName}
                        sessionId={sessionId || undefined}
                        buttonText="Download"
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-gray-500 mb-4">
                Your purchased stems will be available in your account for future downloads.
              </p>
            </div>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="mb-6 text-red-600">{message}</p>
          </div>
        )}
        
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 