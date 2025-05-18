import React, { useEffect, useRef, useState } from 'react';
import { Track, Stem } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { StaticWaveform, WaveformPlayer } from '../waveform/WaveformPlayer';
import { getWaveformUrl } from '../../utils/waveform';

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
  const [soloed, setSoloed] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [buffers, setBuffers] = useState<Record<string, AudioBuffer | null>>({});
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Record<string, AudioBufferSourceNode>>({});
  const gainNodesRef = useRef<Record<string, GainNode>>({});
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const waveformCache = useRef<Record<string, number[]>>({});
  const activeSourcesRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const isPausingRef = useRef(false);

  // Load and decode all stems when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setBuffers({});
    setDuration(0);
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    console.log('[AudioContext] Created, currentTime:', ctx.currentTime);
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
        console.log('[Buffers] Set:', Object.keys(bufferMap));
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

  // Update gain nodes on solo/mute change and after play/resume
  useEffect(() => {
    Object.entries(gainNodesRef.current).forEach(([id, gain]) => {
      if (gain) {
        if (soloed.size > 0) {
          gain.gain.value = soloed.has(id) && !muted[id] ? 1 : 0;
        } else {
          gain.gain.value = muted[id] ? 0 : 1;
        }
      }
    });
  }, [soloed, muted, isPlaying]);

  // Play all stems in sync
  const handlePlay = () => {
    if (!audioCtxRef.current) return;
    isPausingRef.current = false;
    console.log('[Play] AudioContext currentTime:', audioCtxRef.current.currentTime);
    stopAll();
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    startTimeRef.current = now - pausedAtRef.current;
    console.log('[Play] startTimeRef.current:', startTimeRef.current, 'pausedAtRef.current:', pausedAtRef.current);
    activeSourcesRef.current = 0;
    (track.stems || []).forEach(stem => {
      const buf = buffers[stem.id];
      if (!buf) return;
      const source = ctx.createBufferSource();
      source.buffer = buf;
      let gain = gainNodesRef.current[stem.id];
      if (!gain) {
        gain = ctx.createGain();
        gainNodesRef.current[stem.id] = gain;
      }
      // Always use latest soloed/muted state
      if (soloed.size > 0) {
        gain.gain.value = soloed.has(stem.id) && !muted[stem.id] ? 1 : 0;
      } else {
        gain.gain.value = muted[stem.id] ? 0 : 1;
      }
      source.connect(gain).connect(ctx.destination);
      source.start(0, pausedAtRef.current);
      sourcesRef.current[stem.id] = source;
      activeSourcesRef.current++;
      source.onended = () => {
        activeSourcesRef.current--;
        if (activeSourcesRef.current <= 0) {
          setIsPlaying(false);
          if (!isPausingRef.current) {
            pausedAtRef.current = 0;
            setCurrentTime(0);
            console.log('[Ended] Resetting pausedAtRef.current');
          } else {
            console.log('[Paused] Not resetting pausedAtRef.current');
          }
        }
      };
    });
    setIsPlaying(true);
  };

  // Pause all
  const handlePause = () => {
    if (!audioCtxRef.current) return;
    isPausingRef.current = true;
    console.log('[Pause] AudioContext currentTime:', audioCtxRef.current.currentTime);
    const ctx = audioCtxRef.current;
    pausedAtRef.current = ctx.currentTime - startTimeRef.current;
    setCurrentTime(pausedAtRef.current);
    console.log('[Pause] pausedAtRef.current:', pausedAtRef.current);
    stopAll();
    setIsPlaying(false);
    setTimeout(() => { isPausingRef.current = false; }, 100); // Reset after sources stop
  };

  // Seek
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    pausedAtRef.current = time;
    if (isPlaying) {
      wasPlayingRef.current = true;
      handlePlay(); // Restart playback from new position
    } else {
      wasPlayingRef.current = false;
      stopAll(); // Ensure all sources are stopped
    }
  };

  // Solo (multi-solo)
  const handleSolo = (stemId: string) => {
    setSoloed(prev => {
      const next = new Set(prev);
      if (next.has(stemId)) {
        next.delete(stemId);
      } else {
        next.add(stemId);
      }
      return next;
    });
  };

  // Mute
  const handleMute = (stemId: string) => {
    setMuted(prev => {
      const newMuted = { ...prev, [stemId]: !prev[stemId] };
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
      console.log('[Popup Close] Resetting pausedAtRef.current');
      stopAll();
      setIsPlaying(false);
      setCurrentTime(0);
      pausedAtRef.current = 0;
      setSoloed(new Set());
      setMuted({});
      setBuffers({});
      setDuration(0);
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  // Add this child component for each stem row
  interface StemWaveformRowProps {
    stem: Stem;
    soloed: Set<string>;
    muted: Record<string, boolean>;
    handleSolo: (id: string) => void;
    handleMute: (id: string) => void;
    addItem: (item: any) => void;
    track: Track;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    onScrub: (time: number) => void;
  }
  const StemWaveformRow: React.FC<StemWaveformRowProps> = ({ stem, soloed, muted, handleSolo, handleMute, addItem, track, isPlaying, currentTime, duration, onScrub }) => {
    const [waveformData, setWaveformData] = useState<number[] | null>(null);
    const [waveformLoading, setWaveformLoading] = useState(false);
    // Load waveform as before
    useEffect(() => {
      let waveformUrl = '';
      if (stem.mp3Url) {
        waveformUrl = getWaveformUrl(stem.mp3Url);
      } else if (stem.wavUrl) {
        waveformUrl = getWaveformUrl(stem.wavUrl);
      }
      if (waveformCache.current[stem.id]) {
        setWaveformData(waveformCache.current[stem.id]);
        setWaveformLoading(false);
        return;
      }
      if (waveformUrl) {
        setWaveformLoading(true);
        fetch(waveformUrl)
          .then(res => res.json())
          .then(data => {
            let arr: number[] | null = null;
            if (Array.isArray(data)) arr = data;
            else if (Array.isArray(data.peaks)) arr = data.peaks;
            else if (Array.isArray(data.data)) arr = data.data;
            if (arr) {
              waveformCache.current[stem.id] = arr;
              setWaveformData(arr);
            } else if (!waveformCache.current[stem.id]) {
              setWaveformData(null);
            }
          })
          .catch(() => {
            if (!waveformCache.current[stem.id]) setWaveformData(null);
          })
          .finally(() => setWaveformLoading(false));
      } else if (Array.isArray(stem.waveform)) {
        waveformCache.current[stem.id] = stem.waveform;
        setWaveformData(stem.waveform);
      } else if (!waveformCache.current[stem.id]) {
        setWaveformData(null);
      }
    }, [stem.id, stem.mp3Url, stem.wavUrl, stem.waveform]);
    return (
      <div className="flex items-center rounded-lg px-4 py-3">
        <div className="flex-1 text-white font-medium">{stem.name}</div>
        {/* Waveform visualization */}
        <div className="w-64 h-10 flex items-center justify-center rounded mr-4">
          {waveformLoading && !waveformData ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : waveformData ? (
            <StaticWaveform
              data={waveformData}
              progress={duration > 0 ? currentTime / duration : 0}
              width="100%"
              height={40}
              onScrub={rel => onScrub(rel * duration)}
            />
          ) : (
            <span className="text-xs text-gray-400">No waveform</span>
          )}
        </div>
        {/* Solo/Mute Buttons */}
        <div className="flex gap-2 mx-4">
          <button
            className={`w-8 h-8 rounded font-bold ${soloed.has(stem.id) ? 'bg-accent text-black' : 'bg-gray-700 text-white'} hover:bg-accent`}
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
    );
  };

  useEffect(() => {
    console.log('track.stems:', track.stems);
  }, [track.stems, isOpen]);

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
              <StemWaveformRow
                key={stem.id || stem.name}
                stem={stem}
                soloed={soloed}
                muted={muted}
                handleSolo={handleSolo}
                handleMute={handleMute}
                addItem={addItem}
                track={track}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onScrub={handleSeek}
              />
            ))}
          </div>
        )}
        {/* Play/Pause All Button & Progress Bar */}
        {!loading && !error && (
          <div className="flex flex-col items-center mt-6">
            <div className="w-full flex items-center gap-4 mb-2">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className={`bg-accent text-black px-6 py-2 rounded-lg font-semibold hover:bg-accent/90 text-lg ${isPlaying ? 'active' : ''}`}
              >
                {isPlaying ? 'Pause' : 'Play'} All
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