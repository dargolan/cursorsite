import React, { useEffect, useRef, useState } from 'react';
import { Track, Stem } from '../../types';
import { useCart } from '../../contexts/CartContext';

interface StemsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
}

const StemsPopup: React.FC<StemsPopupProps> = ({ isOpen, onClose, track }) => {
  const { addItem } = useCart();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [soloed, setSoloed] = useState<string | null>(null);
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [buffers, setBuffers] = useState<Record<string, AudioBuffer | null>>({});
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Record<string, AudioBufferSourceNode>>({});
  const gainNodesRef = useRef<Record<string, GainNode>>({});
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Load and decode all stems when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setBuffers({});
    setDuration(0);
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    let isCancelled = false;
    const fetchAndDecode = async () => {
      try {
        const entries = await Promise.all(
          (track.stems || []).map(async (stem) => {
            const url = stem.mp3Url || stem.wavUrl;
            if (!url) return [stem.id, null];
            const resp = await fetch(url);
            const arr = await resp.arrayBuffer();
            const buf = await ctx.decodeAudioData(arr);
            return [stem.id, buf] as [string, AudioBuffer];
          })
        );
        if (isCancelled) return;
        const bufferMap: Record<string, AudioBuffer> = Object.fromEntries(entries.filter(([id, buf]) => buf));
        setBuffers(bufferMap);
        // Set duration to the max buffer duration
        setDuration(Math.max(...Object.values(bufferMap).map(b => b.duration)) || 0);
        setLoading(false);
      } catch (e) {
        setError('Failed to load stems.');
        setLoading(false);
      }
    };
    fetchAndDecode();
    return () => {
      isCancelled = true;
      ctx.close();
    };
  }, [isOpen, track.stems]);

  // Stop all sources
  const stopAll = () => {
    Object.values(sourcesRef.current).forEach(src => {
      try { src.stop(); } catch {}
    });
    sourcesRef.current = {};
  };

  // Play all stems in sync
  const handlePlay = () => {
    if (!audioCtxRef.current) return;
    stopAll();
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    startTimeRef.current = now - pausedAtRef.current;
    (track.stems || []).forEach(stem => {
      const buf = buffers[stem.id];
      if (!buf) return;
      const source = ctx.createBufferSource();
      source.buffer = buf;
      const gain = ctx.createGain();
      // Solo/mute logic
      if (soloed) {
        gain.gain.value = soloed === stem.id ? 1 : 0;
      } else {
        gain.gain.value = muted[stem.id] ? 0 : 1;
      }
      source.connect(gain).connect(ctx.destination);
      source.start(0, pausedAtRef.current);
      sourcesRef.current[stem.id] = source;
      gainNodesRef.current[stem.id] = gain;
      source.onended = () => {
        setIsPlaying(false);
        pausedAtRef.current = 0;
        setCurrentTime(0);
      };
    });
    setIsPlaying(true);
  };

  // Pause all
  const handlePause = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    pausedAtRef.current = ctx.currentTime - startTimeRef.current;
    stopAll();
    setIsPlaying(false);
  };

  // Seek
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    pausedAtRef.current = time;
    if (isPlaying) {
      handlePlay();
    }
  };

  // Solo
  const handleSolo = (stemId: string) => {
    setSoloed(prev => {
      const newSolo = prev === stemId ? null : stemId;
      // Update gain nodes
      Object.entries(gainNodesRef.current).forEach(([id, gain]) => {
        if (gain) gain.gain.value = newSolo ? (id === stemId ? 1 : 0) : (muted[id] ? 0 : 1);
      });
      return newSolo;
    });
  };

  // Mute
  const handleMute = (stemId: string) => {
    setMuted(prev => {
      const newMuted = { ...prev, [stemId]: !prev[stemId] };
      // Update gain nodes
      Object.entries(gainNodesRef.current).forEach(([id, gain]) => {
        if (gain) gain.gain.value = soloed ? (id === soloed ? 1 : 0) : (newMuted[id] ? 0 : 1);
      });
      return newMuted;
    });
  };

  // Add all stems to cart with discount
  const handleAddAllToCart = () => {
    track.stems?.forEach(stem => {
      addItem({
        id: stem.id,
        name: stem.name,
        trackName: track.title,
        price: Math.round(stem.price * 0.75 * 100) / 100,
        imageUrl: track.imageUrl,
        type: 'stem',
      });
    });
  };

  // Progress bar timer
  useEffect(() => {
    if (!isPlaying || !audioCtxRef.current) return;
    let raf: number;
    const update = () => {
      const ctx = audioCtxRef.current!;
      const t = ctx.currentTime - startTimeRef.current;
      setCurrentTime(Math.min(t, duration));
      if (t < duration) raf = requestAnimationFrame(update);
      else setIsPlaying(false);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, duration]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopAll();
      setIsPlaying(false);
      setCurrentTime(0);
      pausedAtRef.current = 0;
      setSoloed(null);
      setMuted({});
      setBuffers({});
      setDuration(0);
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl mx-auto p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Stems</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        </div>
        {/* Add All to Cart */}
        <div className="flex justify-end mb-4">
          <button onClick={handleAddAllToCart} className="bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent/90">Add All Stems to Cart</button>
        </div>
        {/* Loading/Error */}
        {loading && <div className="text-white text-center py-8">Loading stems...</div>}
        {error && <div className="text-red-400 text-center py-8">{error}</div>}
        {/* Stems List */}
        {!loading && !error && (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {track.stems?.map((stem: Stem) => (
              <div key={stem.id} className="flex items-center bg-gray-800 rounded-lg px-4 py-3">
                <div className="flex-1 text-white font-medium">{stem.name}</div>
                {/* Solo/Mute Buttons */}
                <div className="flex gap-2 mx-4">
                  <button
                    className={`w-8 h-8 rounded font-bold ${soloed === stem.id ? 'bg-accent text-black' : 'bg-gray-700 text-white'} hover:bg-accent`}
                    onClick={() => handleSolo(stem.id)}
                  >S</button>
                  <button
                    className={`w-8 h-8 rounded font-bold ${muted[stem.id] ? 'bg-accent text-black' : 'bg-gray-700 text-white'} hover:bg-accent`}
                    onClick={() => handleMute(stem.id)}
                  >M</button>
                </div>
                {/* Add to Cart Button */}
                <button onClick={() => addItem({
                  id: stem.id,
                  name: stem.name,
                  trackName: track.title,
                  price: stem.price,
                  imageUrl: track.imageUrl,
                  type: 'stem',
                })} className="ml-2 bg-accent text-white px-3 py-2 rounded-lg font-semibold hover:bg-accent/90">Add to Cart</button>
              </div>
            ))}
          </div>
        )}
        {/* Play/Pause All Button & Progress Bar */}
        {!loading && !error && (
          <div className="flex flex-col items-center mt-6">
            <div className="w-full flex items-center gap-4 mb-2">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="bg-accent text-black px-6 py-2 rounded-lg font-semibold hover:bg-accent/90 text-lg"
              >
                {isPlaying ? 'Pause All' : 'Play All'}
              </button>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.01}
                value={currentTime}
                onChange={e => handleSeek(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <span className="text-white font-mono text-sm min-w-[60px] text-right">
                {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration) % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StemsPopup; 