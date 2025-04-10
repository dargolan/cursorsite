'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setMessage('No session ID provided');
      return;
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
            const { stemId, trackId } = data.session.metadata;
            
            // Fetch stem details to get the name
            if (stemId) {
              try {
                const stemResponse = await fetch(`/api/stems/${stemId}`);
                const stemData = await stemResponse.json();
                
                setPurchaseDetails({
                  stemId,
                  stemName: stemData.name || 'Purchased Stem',
                  trackId: trackId || '',
                  trackName: stemData.trackName || '',
                });
              } catch (err) {
                console.error('Error fetching stem details:', err);
                // Fallback to basic info without the stem name
                setPurchaseDetails({
                  stemId,
                  stemName: 'Purchased Stem',
                  trackId: trackId || '',
                  trackName: '',
                });
              }
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
  }, [sessionId]);

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
            
            {/* Download button for purchased stem */}
            {purchaseDetails && purchaseDetails.stemId && (
              <div className="mb-6">
                <p className="mb-3 text-gray-600">
                  Your stem is ready for download:
                </p>
                <DownloadButton 
                  stemId={purchaseDetails.stemId}
                  stemName={purchaseDetails.stemName}
                  sessionId={sessionId || undefined}
                  buttonText="Download Your Stem"
                  className="px-6 py-3 text-lg"
                />
              </div>
            )}
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