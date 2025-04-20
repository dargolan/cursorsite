import React from 'react';
import { Stem } from '../../types';
import { useStemManagement } from '../../hooks/useStemManagement';

interface StemControlsProps {
  trackTitle: string;
  trackImageUrl: string;
  stems: Stem[];
  openStemsTrackId: string | null;
  setOpenStemsTrackId: (id: string | null) => void;
}

export function StemControls({
  trackTitle,
  trackImageUrl,
  stems,
  openStemsTrackId,
  setOpenStemsTrackId
}: StemControlsProps) {
  const {
    loadingStems,
    stemUrls,
    handleStemPlayPause,
    handleStemAddToCart,
    handleStemRemoveFromCart,
    isStemInCart
  } = useStemManagement({
    trackTitle,
    stems,
    trackImageUrl
  });

  const handleDownloadAllStems = () => {
    stems.forEach(stem => {
      const url = stemUrls[stem.id] || stem.url;
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${trackTitle}_${stem.name}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Stems</h3>
        <button
          onClick={handleDownloadAllStems}
          className="text-sm text-[#1DF7CE] hover:text-white transition-colors"
        >
          Download All
        </button>
      </div>

      <div className="space-y-2">
        {stems.map(stem => (
          <div
            key={stem.id}
            className="flex items-center justify-between p-2 bg-[#232323] rounded"
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleStemPlayPause(stem.id)}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                disabled={loadingStems[stem.id]}
              >
                {loadingStems[stem.id] ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                )}
              </button>
              <span className="text-sm">{stem.name}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">${stem.price}</span>
              {isStemInCart(stem.id) ? (
                <button
                  onClick={() => handleStemRemoveFromCart(stem)}
                  className="text-sm text-red-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => handleStemAddToCart(stem)}
                  className="text-sm text-[#1DF7CE] hover:text-white transition-colors"
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 