'use client';

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface StemVisualWaveformProps {
  audioUrl: string; // Re-added: WaveSurfer might need it for context even with peaks
  peaks?: number[];    // Pre-computed waveform data
  progress: number; // 0 to 1, controlled externally
  height?: number;
  waveColor?: string;
  progressColor?: string;
  onScrub?: (progress: number) => void;
  // No onScrub, onPlay, onPause, isPlaying, etc. as it's visual only
}

export const StemVisualWaveform: React.FC<StemVisualWaveformProps> = ({
  audioUrl, // Re-added
  peaks,
  progress,
  height = 24, // Default height for stem rows
  waveColor = '#4a5568', // Default theme wave color
  progressColor = '#1DF7CE', // Default theme progress color
  onScrub,
}) => {
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  // isLoading is now primarily for if peaks are not yet provided, or if WS itself has issues.
  const [isLoading, setIsLoading] = useState(!peaks || peaks.length === 0);
  const [error, setError] = useState<string | null>(null);
  const prevProgressRef = useRef<number>(progress);
  const isDragging = useRef(false);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!waveContainerRef.current || !isMounted.current) return;
    
    if (!peaks || peaks.length === 0) {
        setIsLoading(true); // Keep loading if no peaks
        if (wavesurfer.current) {
            wavesurfer.current.destroy(); // Destroy existing instance if peaks are gone
            wavesurfer.current = null;
        }
        return;
    }

    const container = waveContainerRef.current;
    const containerId = `stem-waveform-${Math.random().toString(36).substring(2, 9)}`;
    container.id = containerId;
    setIsLoading(false); // Peaks are available, not loading from WS perspective
    setError(null);

    try {
      if (typeof (WaveSurfer as any).create !== 'function') {
        setError('WaveSurfer library not loaded correctly');
        return;
      }

      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
      
      console.log(`[StemVisualWaveform] Initializing for ${audioUrl} with peaks:`, peaks ? `${peaks.length} points` : 'No peaks');

      const wsInstance = (WaveSurfer as any).create({
        container: `#${containerId}`,
        waveColor,
        progressColor,
        height,
        cursorWidth: 0,
        interact: false,
        normalize: true, 
        responsive: true,
        fillParent: true,
        peaks: peaks, 
        url: audioUrl, // Pass audioUrl for context, even if peaks are primary
      });
      wavesurfer.current = wsInstance;

      const ws = wavesurfer.current as any;
      if (ws && typeof progress === 'number') {
        setTimeout(() => {
          if (isMounted.current && typeof ws.seekTo === 'function') {
            ws.seekTo(progress);
          }
        }, 0);
      }
      prevProgressRef.current = progress;

    } catch (err: any) {
      if (isMounted.current) {
        console.error('Error creating StemVisualWaveform WaveSurfer with peaks:', err);
        setError(`Init err: ${err.message}`);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, peaks, height, waveColor, progressColor]);

  useEffect(() => {
    const ws = wavesurfer.current as any;
    if (ws && typeof ws.seekTo === 'function' && typeof progress === 'number' && progress !== prevProgressRef.current) {
      if (ws.isReady || typeof ws.isReady === 'undefined') { 
        ws.seekTo(progress);
      }
      prevProgressRef.current = progress;
    }
  }, [progress]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onScrub || isLoading || error) return;
    isDragging.current = true;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.min(1, Math.max(0, x / rect.width));
    onScrub(newProgress);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !onScrub || isLoading || error) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = Math.min(1, Math.max(0, x / rect.width));
    onScrub(newProgress);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="w-full h-full relative" style={{padding: 0, margin: 0}}>
      {isLoading && (!peaks || peaks.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ height: `${height}px` }}>
          <p className="text-xs text-gray-500">Loading waveform data...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ height: `${height}px` }}>
          <p className="text-xs text-red-400 truncate" title={error}>{error}</p>
        </div>
      )}
      <div 
        ref={waveContainerRef} 
        className="w-full h-full"
        style={{ 
          minHeight: `${height}px`, 
          visibility: isLoading || error ? 'hidden' : 'visible',
          cursor: onScrub ? 'pointer' : 'default',
          padding: 0,
          margin: 0,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
}; 