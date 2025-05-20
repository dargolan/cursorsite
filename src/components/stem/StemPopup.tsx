import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Track, Stem } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { StaticWaveform } from '../waveform/WaveformPlayer'; // Assuming WaveformPlayer is not needed directly
import { getWaveformUrl } from '../../utils/waveform';
import { flushSync } from 'react-dom';
import { StemAudioManager, StemAudioEventMap } from '../../lib/StemAudioManager'; // Import the manager

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

const StemsPopup: React.FC<StemsPopupProps> = ({ isOpen, onClose, track }) => {
  const { addItem } = useCart();
  const audioManagerRef = useRef<StemAudioManager | null>(null);

  // UI State derived from StemAudioManager events
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [soloed, setSoloed] = useState<ReadonlySet<string>>(new Set());
  const [muted, setMuted] = useState<ReadonlySet<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waveformCache, setWaveformCache] = useState<Record<string, number[]>>({});


  // Initialize and destroy StemAudioManager
  useEffect(() => {
    if (isOpen) {
      console.log("[StemsPopup] Initializing StemAudioManager");
      const manager = new StemAudioManager();
      audioManagerRef.current = manager;

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
        setIsLoading(false); // No stems to load
      }


      const handleStateChange = (payload: StemAudioEventMap['statechange']) => {
        flushSync(() => { // Ensure immediate UI updates for critical state
          setIsPlaying(payload.isPlaying);
          setCurrentTime(payload.currentTime);
          setDuration(payload.duration);
          setIsLoading(payload.loading);
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
        setDuration(payload.duration); // Update duration once buffers are loaded
        setIsLoading(false);
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
        setIsLoading(true); setError(null); setWaveformCache({});
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

  const handleStemAddToCart = useCallback((stem: Stem) => {
    addItem({
      id: `${track.id}-${stem.id}`, // Ensure unique ID for cart items if stems can have same ID across tracks
      name: stem.name,
      trackName: track.title,
      price: stem.price,
      imageUrl: track.imageUrl, // Assuming track has an imageUrl
      type: 'stem',
    });
  }, [addItem, track]);
  
  const handleAddAllToCart = useCallback(() => {
    track.stems?.forEach(stem => {
      addItem({
        id: `${track.id}-${stem.id}`,
        name: stem.name,
        trackName: track.title,
        price: Math.round(stem.price * 0.75 * 100) / 100, // 25% discount
        imageUrl: track.imageUrl,
        type: 'stem',
      });
    });
  }, [addItem, track]);
  
  const memoizedStems = useMemo(() => track.stems || [], [track.stems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-3xl mx-auto p-6 relative text-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Stems for: {track.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
        </div>

        {track.stems && track.stems.length > 0 && (
          <div className="flex justify-end mb-4">
            <button 
              onClick={handleAddAllToCart} 
              className="bg-accent text-black px-4 py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
            >
              Add All Stems to Cart (25% off)
            </button>
          </div>
        )}

        {isLoading && <div className="text-center py-8">Loading stems...</div>}
        {error && <div className="text-red-400 text-center py-8">Error: {error}</div>}
        
        {!isLoading && !error && memoizedStems.length === 0 && (
          <div className="text-center py-8">No stems available for this track.</div>
        )}

        {!isLoading && !error && memoizedStems.length > 0 && (
          <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            {memoizedStems.map((stem) => (
              <StemWaveformRow
                key={stem.id}
                stem={stem}
                soloed={soloed}
                muted={muted}
                handleSolo={handleToggleSolo}
                handleMute={handleToggleMute}
                addItem={handleStemAddToCart}
                trackId={track.id} // Pass trackId for unique cart item IDs
                trackImageUrl={track.imageUrl}
                // For waveform display (will be re-enabled carefully)
                audioManager={audioManagerRef.current} // Pass manager for independent time tracking if needed
                currentTime={currentTime} // Main current time for sync
                duration={duration}     // Overall duration
                waveformCache={waveformCache}
                setWaveformCache={setWaveformCache}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && duration > 0 && (
          <div className="flex flex-col items-center mt-6 pt-4 border-t border-gray-700">
            <div className="w-full flex items-center gap-4 mb-2">
              <button
                onClick={handlePlayPause}
                className={`bg-accent text-black px-6 py-3 rounded-lg font-semibold hover:bg-accent/90 text-lg w-32 transition-colors ${isPlaying ? 'active' : ''}`}
              >
                {isPlaying ? 'Pause All' : 'Play All'}
              </button>
              <div className="flex-grow flex items-center gap-2">
                <span className="text-sm font-mono min-w-[45px]">{formatDisplayTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={currentTime}
                  onChange={e => handleSeek(Number(e.target.value))}
                  className="w-full accent-accent h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-mono min-w-[45px]">{formatDisplayTime(duration)}</span>
              </div>
            </div>
          </div>
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
  addItem: (stem: Stem) => void; // Modified to take Stem directly
  trackId: string;
  trackImageUrl?: string;
  // Waveform related props
  audioManager: StemAudioManager | null; // For potential independent time tracking
  currentTime: number;
  duration: number;
  waveformCache: Record<string, number[]>;
  setWaveformCache: React.Dispatch<React.SetStateAction<Record<string, number[]>>>;
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
  audioManager, // For potential advanced waveform sync
  currentTime,
  duration,
  waveformCache,
  setWaveformCache
}) => {
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);

  useEffect(() => {
    const stemUrl = stem.mp3Url || stem.wavUrl;
    if (!stemUrl) {
      setWaveformData(null); return;
    }
    const cached = waveformCache[stem.id];
    if (cached) {
      setWaveformData(cached); return;
    }

    setIsLoadingWaveform(true);
    const wfUrl = getWaveformUrl(stemUrl); // Assumes getWaveformUrl converts CDN URL to waveform data URL
    fetch(wfUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Waveform fetch failed: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const peaks = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : (Array.isArray(data.peaks) ? data.peaks : null) );
        if (peaks) {
          setWaveformCache(prev => ({...prev, [stem.id]: peaks}));
          setWaveformData(peaks);
        } else {
          setWaveformData(null);
        }
      })
      .catch(err => {
        console.error(`Failed to load waveform for ${stem.name}:`, err);
        setWaveformData(null);
      })
      .finally(() => setIsLoadingWaveform(false));
  }, [stem.id, stem.mp3Url, stem.wavUrl, waveformCache, setWaveformCache]);

  const isSoloed = soloed.has(stem.id);
  const isMuted = muted.has(stem.id);

  console.log(`[StemWaveformRow MEMO] Rendering for stem: ${stem.name}. Solo: ${isSoloed}, Mute: ${isMuted}`);

  return (
    <div className="flex items-center bg-gray-800 p-3 rounded-lg shadow gap-3 hover:bg-gray-750 transition-colors">
      <div className="flex-shrink-0 w-1/4">
        <p className="text-sm font-semibold truncate" title={stem.name}>{stem.name}</p>
        {/* <p className="text-xs text-gray-400">{formatDisplayTime(duration)}</p> */}
      </div>

      <div className="flex-grow h-10 bg-gray-700 rounded flex items-center justify-center overflow-hidden">
        {isLoadingWaveform && <p className="text-xs text-gray-500">Loading waveform...</p>}
        {!isLoadingWaveform && waveformData && duration > 0 && (
          <StaticWaveform 
            data={waveformData} 
            progress={currentTime / duration}
            width="100%" 
            height={40}
            // onScrub prop is not used here, scrubbing is handled by main progress bar
          />
        )}
        {!isLoadingWaveform && !waveformData && <p className="text-xs text-gray-500">No waveform data</p>}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          title={isSoloed ? "Unsolo" : "Solo"}
          className={`w-9 h-9 rounded font-bold transition-colors ${isSoloed ? 'bg-accent text-black' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
          onClick={() => handleSolo(stem.id)}
        >S</button>
        <button
          title={isMuted ? "Unmute" : "Mute"}
          className={`w-9 h-9 rounded font-bold transition-colors ${isMuted ? 'bg-accent text-black' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
          onClick={() => handleMute(stem.id)}
        >M</button>
      </div>
      <button 
        onClick={() => addItem(stem)} 
        className="bg-accent-secondary text-white px-3 py-2 rounded-md font-semibold hover:bg-accent-secondary/90 transition-colors text-sm h-9 flex-shrink-0"
      >
        Add ${stem.price?.toFixed(2) || 'N/A'}
      </button>
    </div>
  );
});

export default StemsPopup; 