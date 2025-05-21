import React from 'react';
import { Stem } from '../../types';
import { formatTime } from '../../utils/time-format';

interface StemsSectionProps {
  stems: Stem[];
  isOpen: boolean;
  playingStems: Record<string, boolean>;
  stemProgress: Record<string, number>;
  stemLoadErrors: Record<string, boolean>;
  stemLoading: Record<string, boolean>;
  stemAddedToCart: Record<string, boolean>;
  onStemPlayPause: (stemId: string) => void;
  onStemAddToCart: (stem: Stem) => void;
  onStemRemoveFromCart: (stem: Stem) => void;
  onDownloadAllStems: () => void;
  totalStemsPrice: number;
  discountedStemsPrice: number;
}

export default function StemsSection({
  stems,
  isOpen,
  playingStems,
  stemProgress,
  stemLoadErrors,
  stemLoading,
  stemAddedToCart,
  onStemPlayPause,
  onStemAddToCart,
  onStemRemoveFromCart,
  onDownloadAllStems,
  totalStemsPrice,
  discountedStemsPrice
}: StemsSectionProps) {
  if (!isOpen || !stems) return null;

  return (
    <div className="bg-[#232323] rounded-b p-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        {stems.map(stem => (
          <div 
            key={stem.id} 
            className="rounded p-3 flex items-center hover:bg-[#2A2A2A] transition-colors"
          >
            <div className="w-14 mr-2">
              <p className="font-bold text-xs text-white break-words leading-tight">{stem.name}</p>
            </div>
            
            <button 
              onClick={() => onStemPlayPause(stem.id)}
              className={`w-8 h-8 flex items-center justify-center ${
                stemLoadErrors[stem.id] ? 'text-amber-500' : 
                stemLoading[stem.id] ? 'text-gray-400' : 'text-white'
              } hover:text-[#1DF7CE] mr-2`}
              disabled={false}
              title={
                stemLoadErrors[stem.id] ? "Audio unavailable - Click to simulate playback" : 
                stemLoading[stem.id] ? "Loading stem audio..." : 
                playingStems[stem.id] ? "Pause stem" : "Play stem"
              }
            >
              {stemLoadErrors[stem.id] ? (
                playingStems[stem.id] ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                    <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                    <circle cx="20" cy="4" r="2" fill="currentColor" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
                    <circle cx="19" cy="5" r="2" fill="currentColor" />
                  </svg>
                )
              ) : stemLoading[stem.id] ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"></circle>
                  <path d="M12 2C6.5 2 2 6.5 2 12"></path>
                </svg>
              ) : playingStems[stem.id] ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                  <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
                </svg>
              )}
            </button>
            
            {/* Progress bar for stems */}
            <div 
              className="flex-grow h-4 relative mx-1 flex items-center"
              style={{ maxWidth: "calc(62% - 50px)" }}
            >
              {/* Gray track background */}
              <div className="w-full h-[8px] bg-[#3A3A3A] rounded-full cursor-pointer" />
              
              {stemLoadErrors[stem.id] ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-red-400">
                    {playingStems[stem.id] ? 'Simulating playback' : 'Audio unavailable'}
                  </div>
                  {playingStems[stem.id] && (
                    <div 
                      className="absolute top-1/2 h-[8px] rounded-full bg-amber-500/30 transform -translate-y-1/2"
                      style={{ width: `${stemProgress[stem.id] || 0}%`, left: 0 }}
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Teal progress fill */}
                  <div 
                    className={`absolute top-1/2 h-[8px] rounded-full ${playingStems[stem.id] ? 'bg-[#1DF7CE]' : 'bg-[#555555]'} transform -translate-y-1/2`}
                    style={{ width: `${stemProgress[stem.id] || 0}%`, left: 0, zIndex: 2 }}
                  />
                  
                  {/* Teal dot at the edge of progress */}
                  <div 
                    className={`absolute w-3.5 h-3.5 rounded-full ${playingStems[stem.id] ? 'bg-[#1DF7CE]' : 'bg-[#555555]'} cursor-pointer`}
                    style={{ 
                      left: `${stemProgress[stem.id] || 0}%`, 
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 3
                    }}
                  />
                </>
              )}
            </div>
            
            <div className="w-20 text-white text-xs font-normal text-center mx-1">
              {formatTime(stemProgress[stem.id] ? (stem.duration * stemProgress[stem.id] / 100) : 0)} / {formatTime(stem.duration)}
            </div>
            
            <div className="flex flex-col items-center ml-1">
              {stemAddedToCart[stem.id] ? (
                <button 
                  onClick={() => onStemRemoveFromCart(stem)}
                  className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                  title="Remove from cart"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    remove_shopping_cart
                  </span>
                </button>
              ) : (
                <button 
                  onClick={() => onStemAddToCart(stem)}
                  className="w-8 h-8 flex items-center justify-center text-[#1DF7CE] hover:text-[#19b8a3] transition-colors"
                  title="Add to cart"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    add_shopping_cart
                  </span>
                </button>
              )}
              <span className="mt-1 text-xs text-[#999999]">€{stem.price}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Buy all stems button */}
      <div style={{ marginRight: '88px' }} className="flex justify-end items-center mt-4">
        <button
          onClick={onDownloadAllStems}
          className="bg-[#1DF7CE] hover:bg-[#19d9b6] text-[#1E1E1E] px-4 py-2 rounded-full font-medium transition-colors"
        >
          <span className="font-medium">Buy All Stems</span>
          <span className="text-xs mx-2 text-black/50 line-through">€{totalStemsPrice}</span>
          <span className="text-sm">€{discountedStemsPrice}</span>
        </button>
      </div>
    </div>
  );
} 