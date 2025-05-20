import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Track, Stem } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { StaticWaveform } from '../waveform/WaveformPlayer'; // Assuming WaveformPlayer is not needed directly
import { getWaveformUrl } from '../../utils/waveform';
import { flushSync } from 'react-dom';
import { StemAudioManager, StemAudioEventMap } from '../../lib/StemAudioManager'; // Import the manager
import { StemVisualWaveform } from '../waveform/StemVisualWaveform'; // Import the new component
import PlayButton from '../AudioPlayer/PlayButton';
import Image from 'next/image';
import StemToast from '../AudioPlayer/StemToast';

// Helper to format time (MM:SS)
const formatDisplayTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

interface StemsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track; // Contains track.stems and potentially track.audioUrl for a main mix
}

interface StemPeaksData {
  isLoading: boolean;
  data: number[] | null;
  error: string | null;
}

const StemsPopup: React.FC<StemsPopupProps> = ({ isOpen, onClose, track }) => {
  const { addItem, removeItem, items } = useCart();
  const audioManagerRef = useRef<StemAudioManager | null>(null);

  // UI State derived from StemAudioManager events
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [soloed, setSoloed] = useState<ReadonlySet<string>>(new Set());
  const [muted, setMuted] = useState<ReadonlySet<string>>(new Set());
  const [isLoadingStems, setIsLoadingStems] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waveformCache, setWaveformCache] = useState<Record<string, number[]>>({});

  // State for managing fetched waveform peak data for each stem
  const [stemPeaksCache, setStemPeaksCache] = useState<Record<string, StemPeaksData>>({});

  // State for main waveform peaks
  const [mainWaveformPeaks, setMainWaveformPeaks] = useState<number[] | null>(null);
  const [mainWaveformLoading, setMainWaveformLoading] = useState(false);
  const [mainWaveformError, setMainWaveformError] = useState<string | null>(null);

  // Track which stems are in the cart for instant UI feedback
  const [cartedStems, setCartedStems] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState<{message: string, type: 'add' | 'buyAll', price?: number} | null>(null);

  // Check if bundle is in cart
  const bundleInCart = useMemo(() =>
    items.some(item => item.id === `${track.id}-bundle`),
    [items, track.id]
  );

  // Check if any individual stems for this track are in cart
  const anyStemInCart = useMemo(() =>
    (track.stems || []).some(stem => items.some(item => item.id === `${track.id}-${stem.id}`)),
    [items, track]
  );

  // Initialize and destroy StemAudioManager
  useEffect(() => {
    if (isOpen) {
      console.log("[StemsPopup] Initializing StemAudioManager");
      const manager = new StemAudioManager();
      audioManagerRef.current = manager;
      setIsLoadingStems(true); // Set loading true when manager starts
      setStemPeaksCache({}); // Clear old peaks cache

      // Attempt to load the main track URL for duration if stems are empty or main track is primary
      // For simplicity, we'll assume track.stems are the primary source of audio here.
      // If track.audioUrl should also be loaded as a separate entity by StemAudioManager, its API needs adjustment.
      // For now, loadStems will determine duration from the provided stems.
      if (track && track.stems) {
        manager.loadStems(track.stems);
      } else if (track && track.audioUrl) {
        // If only a main track URL is provided, and no stems, adapt or enhance StemAudioManager
        // For now, this example focuses on stems.
        console.warn("[StemsPopup] Track has audioUrl but no stems. StemAudioManager currently prioritizes stems.");
        // Potentially create a single "main" stem object if needed:
        // manager.loadStems([{ id: 'main_track', name: track.title, mp3Url: track.audioUrl, price: 0, relativeVolume: 1 }]);
        setIsLoadingStems(false); // No stems to load
      }

      const handleStateChange = (payload: StemAudioEventMap['statechange']) => {
        flushSync(() => {
          setIsPlaying(payload.isPlaying);
          setCurrentTime(payload.currentTime);
          setDuration(payload.duration);
          // Only update isLoadingStems from manager if it's currently true
          // Peaks loading will have its own visual indicator per stem
          if (payload.loading && isLoadingStems) setIsLoadingStems(payload.loading);
          else if (!payload.loading && payload.duration > 0) setIsLoadingStems(false);
          setError(payload.error);
        });
      };
      const handleSoloMuteChange = (payload: StemAudioEventMap['solomutechange']) => {
        flushSync(() => {
          setSoloed(payload.soloedStemIds);
          setMuted(payload.mutedStemIds);
        });
      };
      const handleBuffersLoaded = (payload: StemAudioEventMap['buffersloaded']) => {
        setDuration(payload.duration); 
        setIsLoadingStems(false); // Buffers loaded, main loading is done
      };
       const handleTrackEnded = () => {
        // Reset relevant UI or let statechange handle it
        console.log("[StemsPopup] Track ended event received.");
      };

      const unsubState = manager.on('statechange', handleStateChange);
      const unsubSoloMute = manager.on('solomutechange', handleSoloMuteChange);
      const unsubBuffers = manager.on('buffersloaded', handleBuffersLoaded);
      const unsubEnded = manager.on('trackended', handleTrackEnded);

      return () => {
        console.log("[StemsPopup] Destroying StemAudioManager");
        unsubState();
        unsubSoloMute();
        unsubBuffers();
        unsubEnded();
        manager.destroy();
        audioManagerRef.current = null;
        // Reset state on close
        setIsPlaying(false); setCurrentTime(0); setDuration(0); 
        setSoloed(new Set()); setMuted(new Set()); 
        setIsLoadingStems(true); setError(null); setWaveformCache({});
        setStemPeaksCache({});
      };
    }
  }, [isOpen, track]); // track dependency to reload if track changes while popup is open

  const handlePlayPause = useCallback(() => {
    if (audioManagerRef.current) {
      if (isPlaying) {
        audioManagerRef.current.pause();
      } else {
        audioManagerRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.seek(time);
    }
  }, []);

  const handleToggleSolo = useCallback((stemId: string) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.toggleSolo(stemId);
    }
  }, []);

  const handleToggleMute = useCallback((stemId: string) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.toggleMute(stemId);
    }
  }, []);

  // Add stem to cart with animation and toast, and remove bundle if present
  const handleAddStemToCart = useCallback((stem: Stem) => {
    // Remove bundle if present
    removeItem(`${track.id}-bundle`);
    setCartedStems(prev => new Set(prev).add(stem.id));
    addItem({
      id: `${track.id}-${stem.id}`,
      name: stem.name,
      trackName: track.title,
      price: stem.price,
      imageUrl: track.imageUrl,
      type: 'stem',
    });
    setShowToast({ message: `${stem.name} added to cart`, type: 'add', price: stem.price });
    setTimeout(() => setShowToast(null), 2500);
  }, [addItem, removeItem, track]);

  // Buy all stems (add bundle), and remove all individual stems for this track
  const handleBuyAll = useCallback(() => {
    // Remove all individual stems for this track from the cart
    (track.stems || []).forEach(stem => {
      removeItem(`${track.id}-${stem.id}`);
    });
    const allIds = new Set((track.stems || []).map(s => s.id));
    setCartedStems(allIds);
    // Add a single bundle item
    const total = (track.stems || []).reduce((sum, s) => sum + (s.price || 0), 0);
    const discounted = Math.round(total * 0.75 * 100) / 100;
    addItem({
      id: `${track.id}-bundle`,
      name: `${track.title} (All Stems Bundle)` ,
      trackName: track.title,
      price: discounted,
      imageUrl: track.imageUrl,
      type: 'stem',
    });
    setShowToast({ message: `All stems bundle added to cart`, type: 'buyAll', price: discounted });
    setTimeout(() => setShowToast(null), 2500);
  }, [addItem, removeItem, track]);

  const memoizedStems = useMemo(() => track.stems || [], [track.stems]);

  // Calculate total and discounted prices once
  const totalPrice = useMemo(() => 
    memoizedStems.reduce((sum, s) => sum + (s.price || 0), 0), 
    [memoizedStems]
  );
  const discountedPrice = useMemo(() => 
    Math.round(totalPrice * 0.75 * 100) / 100,
    [totalPrice]
  );

  // Initialize cartedStems when popup opens or cart items change
  useEffect(() => {
    if (isOpen) {
      const newCartedStems = new Set<string>();
      items.forEach(item => {
        if (item.type === 'stem' && item.id.startsWith(`${track.id}-`)) {
          const stemId = item.id.split('-')[1];
          newCartedStems.add(stemId);
        }
      });
      setCartedStems(newCartedStems);
    }
  }, [isOpen, items, track.id]);

  // Effect to fetch waveform data for all stems when they are available
  useEffect(() => {
    if (isOpen && memoizedStems.length > 0) {
      memoizedStems.forEach(stem => {
        const stemAudioUrl = stem.mp3Url || stem.wavUrl;
        if (stemAudioUrl && !stemPeaksCache[stem.id]) {
          setStemPeaksCache(prev => ({ 
            ...prev, 
            [stem.id]: { isLoading: true, data: null, error: null } 
          }));
          const waveformUrl = getWaveformUrl(stemAudioUrl);
          fetch(waveformUrl)
            .then(res => {
              if (!res.ok) throw new Error(`Waveform fetch failed for ${stem.name}: ${res.statusText}`);
              return res.json();
            })
            .then(jsonData => {
              console.log(`[StemsPopup] Waveform JSON for ${stem.name}:`, jsonData);
              const peaksArray = Array.isArray(jsonData) ? jsonData : 
                                (jsonData && Array.isArray(jsonData.data)) ? jsonData.data : 
                                (jsonData && Array.isArray(jsonData.peaks)) ? jsonData.peaks : null;
              console.log(`[StemsPopup] Extracted peaksArray for ${stem.name}:`, peaksArray ? `${peaksArray.length} points` : 'null or invalid');
              if (peaksArray && peaksArray.every((p: any) => typeof p === 'number')) {
                setStemPeaksCache(prev => ({ 
                  ...prev, 
                  [stem.id]: { isLoading: false, data: peaksArray, error: null } 
                }));
              } else {
                throw new Error('Invalid waveform data format');
              }
            })
            .catch(err => {
              console.error(`Failed to load waveform for ${stem.name}:`, err);
              setStemPeaksCache(prev => ({ 
                ...prev, 
                [stem.id]: { isLoading: false, data: null, error: err.message } 
              }));
            });
        }
      });
    }
  }, [isOpen, memoizedStems, stemPeaksCache]); // Add stemPeaksCache to prevent re-fetching if already attempted

  // Effect to fetch main waveform data for the main track
  useEffect(() => {
    if (isOpen && track && track.audioUrl) {
      setMainWaveformLoading(true);
      setMainWaveformError(null);
      setMainWaveformPeaks(null);
      const mainWaveformUrl = getWaveformUrl(track.audioUrl);
      fetch(mainWaveformUrl)
        .then(res => {
          if (!res.ok) throw new Error(`Main waveform fetch failed: ${res.statusText}`);
          return res.json();
        })
        .then(jsonData => {
          const peaksArray = Array.isArray(jsonData) ? jsonData :
            (jsonData && Array.isArray(jsonData.data)) ? jsonData.data :
            (jsonData && Array.isArray(jsonData.peaks)) ? jsonData.peaks : null;
          if (peaksArray && peaksArray.every((p: any) => typeof p === 'number')) {
            setMainWaveformPeaks(peaksArray);
            setMainWaveformLoading(false);
          } else {
            throw new Error('Invalid main waveform data format');
          }
        })
        .catch(err => {
          setMainWaveformError(err.message);
          setMainWaveformLoading(false);
        });
    }
  }, [isOpen, track]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-3xl mx-auto p-6 relative text-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Stems for: {track.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
        </div>

        {/* Main track controls and waveform at the top */}
        {!isLoadingStems && !error && duration > 0 && (
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-16 h-16 flex-shrink-0 mr-4 rounded-md overflow-hidden">
              <Image
                src={track.imageUrl || '/placeholder-image.jpg'}
                alt={track.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/60" />
              <button
                className="absolute inset-0 flex items-center justify-center focus:outline-none"
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                type="button"
              >
                {isPlaying ? (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="8" width="5" height="20" rx="2" fill="white" />
                    <rect x="21" y="8" width="5" height="20" rx="2" fill="white" />
                  </svg>
                ) : (
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="13,9 27,18 13,27" fill="white" />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex-grow h-6 rounded flex items-center justify-center overflow-hidden relative ml-3" style={{marginLeft: 0, paddingLeft: 0}}>
              {mainWaveformLoading && <p className="text-xs text-gray-500">Loading waveform...</p>}
              {mainWaveformError && <p className="text-xs text-red-400 truncate" title={mainWaveformError}>Error loading wave</p>}
              {!mainWaveformLoading && !mainWaveformError && mainWaveformPeaks && mainWaveformPeaks.length > 0 && duration > 0 ? (
                <StemVisualWaveform
                  audioUrl={track.audioUrl || ''}
                  peaks={mainWaveformPeaks}
                  progress={duration > 0 ? currentTime / duration : 0}
                  height={24}
                  onScrub={progress => {
                    if (audioManagerRef.current && duration) {
                      const newTime = progress * duration;
                      audioManagerRef.current.seek(newTime);
                    }
                  }}
                />
              ) : (
                !mainWaveformLoading && !mainWaveformError && <p className="text-xs text-gray-500">No waveform data</p>
              )}
            </div>
            <span className="text-sm font-mono min-w-[60px] text-right">{formatDisplayTime(currentTime)} / {formatDisplayTime(duration)}</span>
          </div>
        )}

        {isLoadingStems && <div className="text-center py-8">Loading stems audio...</div>}
        {error && <div className="text-red-400 text-center py-8">Error: {error}</div>}
        
        {!isLoadingStems && !error && memoizedStems.length === 0 && (
          <div className="text-center py-8">No stems available for this track.</div>
        )}

        {!isLoadingStems && !error && memoizedStems.length > 0 && (
          <>
            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
              {memoizedStems.map((stem) => (
                <StemWaveformRow
                  key={stem.id}
                  stem={stem}
                  soloed={soloed}
                  muted={muted}
                  handleSolo={handleToggleSolo}
                  handleMute={handleToggleMute}
                  addItem={handleAddStemToCart}
                  trackId={track.id}
                  trackImageUrl={track.imageUrl}
                  audioManager={audioManagerRef.current} 
                  currentTime={currentTime}
                  duration={duration}
                  stemAudioUrl={stem.mp3Url || stem.wavUrl}
                  stemPeaks={stemPeaksCache[stem.id]?.data}
                  isPeaksLoading={stemPeaksCache[stem.id]?.isLoading ?? true}
                  peaksError={stemPeaksCache[stem.id]?.error}
                  isInCart={cartedStems.has(stem.id) || bundleInCart}
                  disableAdd={bundleInCart}
                />
              ))}
            </div>
            {/* Buy All Stems button at the bottom right, outside the scrollable stems area */}
            <div className="flex w-full justify-end items-center gap-4 mt-8">
              {/* Price summary */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-lg line-through font-semibold">
                  €{totalPrice.toFixed(2)}
                </span>
                <span className="text-accent text-lg font-bold">
                  €{discountedPrice.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleBuyAll}
                className="bg-accent text-black px-6 py-2 rounded-full font-semibold hover:bg-accent/80 shadow-lg transition-all text-lg"
              >
                Buy All
              </button>
            </div>
            {/* Toast for add/buy all actions */}
            <StemToast showToast={showToast ? {
              stemId: '',
              stemName: showToast.message,
              price: showToast.price || 0,
              action: showToast.type === 'add' ? 'add' : 'add',
            } : null} onClose={() => setShowToast(null)} />
          </>
        )}
      </div>
    </div>
  );
};

interface StemWaveformRowProps {
  stem: Stem;
  soloed: ReadonlySet<string>;
  muted: ReadonlySet<string>;
  handleSolo: (id: string) => void;
  handleMute: (id: string) => void;
  addItem: (stem: Stem) => void;
  trackId: string;
  trackImageUrl?: string;
  audioManager: StemAudioManager | null;
  currentTime: number;
  duration: number;
  stemAudioUrl: string | undefined;
  stemPeaks: number[] | null | undefined;
  isPeaksLoading: boolean;
  peaksError: string | null | undefined;
  isInCart?: boolean;
  disableAdd?: boolean;
}

const StemWaveformRow: React.FC<StemWaveformRowProps> = React.memo(({
  stem,
  soloed,
  muted,
  handleSolo,
  handleMute,
  addItem,
  trackId,
  trackImageUrl,
  audioManager,
  currentTime,
  duration,
  stemAudioUrl,
  stemPeaks,
  isPeaksLoading,
  peaksError,
  isInCart,
  disableAdd,
}) => {
  const isSoloed = soloed.has(stem.id);
  const isMuted = muted.has(stem.id);

  return (
    <div className="flex items-center p-3 gap-3">
      <div className="flex-shrink-0 w-24">
        <p className="text-sm font-semibold truncate" title={stem.name}>{stem.name}</p>
      </div>

      {/* S/M buttons */}
      <div className="flex items-center gap-2 flex-shrink-0 mr-2">
        <button
          title={isSoloed ? "Unsolo" : "Solo"}
          className={`w-7 h-7 rounded font-bold text-xs transition-colors ${isSoloed ? 'bg-accent text-black' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
          onClick={() => handleSolo(stem.id)}
        >S</button>
        <button
          title={isMuted ? "Unmute" : "Mute"}
          className={`w-7 h-7 rounded font-bold text-xs transition-colors ${isMuted ? 'bg-accent text-black' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
          onClick={() => handleMute(stem.id)}
        >M</button>
      </div>

      <div className="flex-grow h-6 rounded flex items-center justify-center overflow-hidden relative ml-3" style={{marginLeft: 0, paddingLeft: 0}}>
        {isPeaksLoading && !peaksError && <p className="text-xs text-gray-500">Loading waveform...</p>}
        {peaksError && <p className="text-xs text-red-400 truncate" title={peaksError}>Error loading wave</p>}
        {!isPeaksLoading && !peaksError && stemPeaks && stemPeaks.length > 0 && duration > 0 ? (
          <StemVisualWaveform 
            audioUrl={stemAudioUrl || ''}
            peaks={stemPeaks} 
            progress={duration > 0 ? currentTime / duration : 0}
            height={24}
            onScrub={(progress) => {
              if (audioManager && duration) {
                const newTime = progress * duration;
                audioManager.seek(newTime);
              }
            }}
          />
        ) : (
          !isPeaksLoading && !peaksError && <p className="text-xs text-gray-500">No waveform data</p>
        )}
      </div>

      {/* Add to cart icon and price */}
      <div className="flex flex-col items-center flex-shrink-0 ml-2">
        <button
          onClick={() => !isInCart && !disableAdd && addItem(stem)}
          className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${isInCart ? 'bg-accent/20' : 'hover:scale-110 hover:shadow-lg'} ${disableAdd ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isInCart ? 'Added to cart' : disableAdd ? 'Bundle in cart' : 'Add to cart'}
          disabled={isInCart || disableAdd}
        >
          <span className="material-symbols-outlined text-accent text-2xl transition-all duration-300" style={{ opacity: isInCart ? 0 : 1, transform: isInCart ? 'scale(0.5)' : 'scale(1)' }}>
            add_shopping_cart
          </span>
          <span className="material-symbols-outlined text-accent text-2xl transition-all duration-300 absolute" style={{ opacity: isInCart ? 1 : 0, transform: isInCart ? 'scale(1)' : 'scale(0.5)' }}>
            check_circle
          </span>
        </button>
        <span className="text-xs text-gray-200 mt-1 font-semibold">€{stem.price?.toFixed(2) || 'N/A'}</span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.stem.id === nextProps.stem.id &&
    prevProps.soloed.has(prevProps.stem.id) === nextProps.soloed.has(nextProps.stem.id) &&
    prevProps.muted.has(prevProps.stem.id) === nextProps.muted.has(nextProps.stem.id) &&
    prevProps.currentTime === nextProps.currentTime &&
    prevProps.duration === nextProps.duration &&
    prevProps.isPeaksLoading === nextProps.isPeaksLoading &&
    prevProps.peaksError === nextProps.peaksError &&
    prevProps.stemAudioUrl === nextProps.stemAudioUrl &&
    prevProps.stemPeaks === nextProps.stemPeaks &&
    prevProps.isInCart === nextProps.isInCart &&
    prevProps.disableAdd === nextProps.disableAdd 
  );
});

export default StemsPopup; 