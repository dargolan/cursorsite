import { useCallback } from 'react';
import { useCart } from '../contexts/CartContext';
import { Stem } from '../types';

interface UseStemCartProps {
  trackId: string;
  trackTitle: string;
  trackImageUrl: string;
}

export function useStemCart({ trackId, trackTitle, trackImageUrl }: UseStemCartProps) {
  const { items, addItem, removeItem } = useCart();

  const handleStemAddToCart = useCallback((stem: Stem) => {
    addItem({
      id: stem.id,
      name: stem.name,
      type: 'stem',
      trackName: trackTitle,
      price: stem.price || 0,
      imageUrl: trackImageUrl || '',
    });
  }, [addItem, trackTitle, trackImageUrl]);

  const handleStemRemoveFromCart = useCallback((stemId: string) => {
    removeItem(stemId);
  }, [removeItem]);

  const isStemInCart = useCallback((stemId: string) => {
    return items.some(item => item.id === stemId && item.type === 'stem');
  }, [items]);

  const handleDownloadAllStems = useCallback(async (stems: Stem[]) => {
    try {
      // Create a zip file containing all stems
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add each stem to the zip
      const downloadPromises = stems.map(async (stem) => {
        try {
          const response = await fetch(stem.url);
          if (!response.ok) throw new Error(`Failed to fetch ${stem.name}`);
          const blob = await response.blob();
          zip.file(`${stem.name}.mp3`, blob);
        } catch (error) {
          console.error(`Error downloading ${stem.name}:`, error);
        }
      });

      await Promise.all(downloadPromises);

      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${trackTitle}_stems.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
    }
  }, [trackTitle]);

  return {
    handleStemAddToCart,
    handleStemRemoveFromCart,
    isStemInCart,
    handleDownloadAllStems,
  };
} 