'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StripeCheckout from '@/components/checkout/StripeCheckout';

interface Stem {
  id: string;
  name: string;
  price: number;
  url: string;
}

interface Track {
  id: string;
  title: string;
  stems: Stem[];
}

export default function StemsPage() {
  const params = useParams();
  const trackId = params.trackId as string;
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        setLoading(true);
        // Fetch track details including stems
        const response = await fetch(`/api/tracks/${trackId}?include=stems`);
        
        if (!response.ok) {
          throw new Error('Failed to load track details');
        }
        
        const data = await response.json();
        setTrack(data);
      } catch (err: any) {
        console.error('Error loading track:', err);
        setError(err.message || 'Failed to load track details');
      } finally {
        setLoading(false);
      }
    };

    if (trackId) {
      fetchTrack();
    }
  }, [trackId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg bg-gray-50">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Track not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{track.title}</h1>
      <p className="text-gray-600 mb-6">Available stems for purchase</p>
      
      <div className="grid gap-4">
        {track.stems.map((stem) => (
          <div key={stem.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{stem.name}</h2>
            <p className="text-gray-700 mb-4">${stem.price.toFixed(2)}</p>
            
            <StripeCheckout 
              stemId={stem.id}
              stemName={stem.name}
              trackId={track.id}
              trackName={track.title}
              price={stem.price}
              buttonText="Buy Now"
            />
          </div>
        ))}
      </div>
    </div>
  );
} 

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StripeCheckout from '@/components/checkout/StripeCheckout';

interface Stem {
  id: string;
  name: string;
  price: number;
  url: string;
}

interface Track {
  id: string;
  title: string;
  stems: Stem[];
}

export default function StemsPage() {
  const params = useParams();
  const trackId = params.trackId as string;
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        setLoading(true);
        // Fetch track details including stems
        const response = await fetch(`/api/tracks/${trackId}?include=stems`);
        
        if (!response.ok) {
          throw new Error('Failed to load track details');
        }
        
        const data = await response.json();
        setTrack(data);
      } catch (err: any) {
        console.error('Error loading track:', err);
        setError(err.message || 'Failed to load track details');
      } finally {
        setLoading(false);
      }
    };

    if (trackId) {
      fetchTrack();
    }
  }, [trackId]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg bg-gray-50">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Track not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{track.title}</h1>
      <p className="text-gray-600 mb-6">Available stems for purchase</p>
      
      <div className="grid gap-4">
        {track.stems.map((stem) => (
          <div key={stem.id} className="p-4 border rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{stem.name}</h2>
            <p className="text-gray-700 mb-4">${stem.price.toFixed(2)}</p>
            
            <StripeCheckout 
              stemId={stem.id}
              stemName={stem.name}
              trackId={track.id}
              trackName={track.title}
              price={stem.price}
              buttonText="Buy Now"
            />
          </div>
        ))}
      </div>
    </div>
  );
} 