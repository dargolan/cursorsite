'use client';

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { convertUrlToProxyUrl } from '../../lib/audio';

interface WaveformPlayerProps {
  audioUrl: string;
  isPlaying: boolean;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  barWidth?: number;
  barGap?: number;
}

// Simple fallback waveform visualization
const FallbackWaveform: React.FC<{
  isPlaying: boolean;
  height: number;
  waveColor: string;
  progressColor: string;
  progress?: number;
}> = ({ isPlaying, height, waveColor, progressColor, progress = 0 }) => {
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="relative w-full h-full flex items-center">
        <div className="absolute inset-0 flex items-center justify-between">
          {Array.from({ length: 50 }).map((_, i) => {
            // Create a semi-random pattern for bars
            const amplitude = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.3) * Math.cos(i * 0.1));
            const heightPercent = amplitude * 100;
            
            // Calculate if this bar should be colored by progress
            const isColored = (i / 50) * 100 <= progress;
            
            return (
              <div
                key={i}
                className={`transition-colors`}
                style={{ 
                  width: '2px',
                  height: `${heightPercent}%`,
                  backgroundColor: isColored ? progressColor : waveColor
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioUrl,
  isPlaying,
  onReady,
  onPlay,
  onPause,
  height = 40,
  waveColor = '#4a5568',
  progressColor = '#3182ce',
  barWidth = 2,
  barGap = 1,
}) => {
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const instanceCreated = useRef(false);

  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    // Set isMounted to true when the component mounts
    isMounted.current = true;
    // Clean up when the component unmounts
    return () => {
      isMounted.current = false;
      // Also destroy the wavesurfer instance
      if (wavesurfer.current) {
        console.log('Cleaning up WaveSurfer instance on unmount');
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, []);

  // Initialize WaveSurfer instance
  useEffect(() => {
    // If we don't have a container ref or the component is not mounted, don't proceed
    if (!waveContainerRef.current || !isMounted.current) return;

    const container = waveContainerRef.current;
    console.log('WaveformPlayer initializing with container:', container);

    // Give a unique ID to the container for easier debugging
    const containerId = `waveform-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    container.id = containerId;

    // Function to create the wavesurfer instance
    const createWavesurfer = () => {
      try {
        // Check if WaveSurfer is available
        if (typeof WaveSurfer !== 'function') {
          console.error('WaveSurfer is not available as a function');
          if (isMounted.current) {
            setError('WaveSurfer library not loaded correctly');
            setLoading(false);
          }
          return;
        }

        // Clean up existing instance if it exists
        if (wavesurfer.current) {
          wavesurfer.current.destroy();
          wavesurfer.current = null;
        }

        console.log('Creating WaveSurfer instance with container ID:', containerId);

        // Create a new WaveSurfer instance
        const options = {
          container: `#${containerId}`,
          waveColor,
          progressColor,
          height,
          barWidth,
          barGap,
          cursorWidth: 0,
          normalize: true,
          responsive: true,
          fillParent: true,
          backend: 'WebAudio',
        };

        console.log('WaveSurfer options:', options);

        // Create the instance - use type casting to avoid TS errors
        const instance = (WaveSurfer as any).create(options);
        wavesurfer.current = instance;
        instanceCreated.current = true;

        // Set up event listeners
        instance.on('ready', () => {
          console.log('WaveSurfer ready event fired');
          if (isMounted.current) {
            setLoading(false);
            if (onReady) onReady();
            
            // If should be playing, start playback
            if (isPlaying) {
              console.log('Auto-playing after ready');
              instance.play();
            }
          }
        });

        instance.on('error', (err: any) => {
          console.error('WaveSurfer error:', err);
          if (isMounted.current) {
            setError(`Failed to load audio waveform: ${err.message || 'Unknown error'}`);
            setLoading(false);
          }
        });

        // Convert the audio URL to a proxy URL to avoid CORS issues
        if (audioUrl) {
          const proxyUrl = convertUrlToProxyUrl(audioUrl);
          console.log('Loading audio URL in WaveSurfer:', proxyUrl);
          instance.load(proxyUrl);
        } else {
          console.error('No audio URL provided');
          if (isMounted.current) {
            setError('No audio URL provided');
            setLoading(false);
          }
        }

        return instance;
      } catch (err: any) {
        console.error('Error creating WaveSurfer instance:', err);
        if (isMounted.current) {
          setError(`Failed to create waveform: ${err.message || 'Unknown error'}`);
          setLoading(false);
        }
        return null;
      }
    };

    // Create the wavesurfer instance
    const instance = createWavesurfer();

    // Cleanup function
    return () => {
      if (instance) {
        console.log('Cleaning up WaveSurfer instance on effect cleanup');
        instance.destroy();
      }
      wavesurfer.current = null;
    };
  }, [audioUrl, height, waveColor, progressColor, barWidth, barGap, onReady]);

  // Control playback
  useEffect(() => {
    if (!wavesurfer.current || !instanceCreated.current) {
      console.log('No wavesurfer instance available for playback control');
      return;
    }

    console.log('Controlling WaveSurfer playback:', isPlaying);
    try {
      if (isPlaying) {
        wavesurfer.current.play();
      } else {
        wavesurfer.current.pause();
      }
    } catch (err) {
      console.error('Error controlling playback:', err);
      // If there's an error, force a fallback
      setError('Error controlling playback');
    }
  }, [isPlaying]);

  // Added state for tracking playback progress for fallback
  const [fallbackProgress, setFallbackProgress] = useState(0);

  // Update fallback progress when playing
  useEffect(() => {
    if (loading || !error) return;
    
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setFallbackProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 0.5;
        });
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, loading, error]);

  return (
    <div className="w-full">
      {loading && (
        <div className="h-10 bg-gray-700 animate-pulse rounded-md"></div>
      )}
      
      {error && (
        <div>
          <FallbackWaveform 
            isPlaying={isPlaying}
            height={height}
            waveColor={waveColor}
            progressColor={progressColor}
            progress={fallbackProgress}
          />
        </div>
      )}
      
      <div 
        ref={waveContainerRef} 
        className="w-full"
        style={{ 
          minHeight: `${height}px`, 
          display: loading || error ? 'none' : 'block',
          border: process.env.NODE_ENV === 'development' ? '1px dashed rgba(255,255,255,0.1)' : 'none'
        }}
      ></div>
    </div>
  );
};

// Also export a lighter version that doesn't actually load the audio
// This is useful for thumbnails or lists where we don't want to load all waveforms
export const StaticWaveform: React.FC<{ data: number[] }> = ({ data }) => {
  // Create a simple SVG representing the waveform
  const maxValue = Math.max(...data, 1);
  const normalizedData = data.map(val => val / maxValue);
  
  const width = 100;
  const height = 30;
  const barWidth = 1;
  const barGap = 0.5;
  const totalBars = Math.floor(width / (barWidth + barGap));
  const sampledData = normalizedData.length > totalBars 
    ? normalizedData.filter((_, i) => i % Math.ceil(normalizedData.length / totalBars) === 0).slice(0, totalBars)
    : normalizedData;

  return (
    <svg width="100%" height={height} className="w-full">
      {sampledData.map((value, i) => (
        <rect
          key={i}
          x={i * (barWidth + barGap)}
          y={(height - value * height) / 2}
          width={barWidth}
          height={value * height}
          fill="#4a5568"
        />
      ))}
    </svg>
  );
}; 
  );
}; 