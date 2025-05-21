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
  waveformData?: number[];
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
  waveformData,
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
          // Add waveform data if available
          peaks: waveformData || undefined,
        };

        console.log('WaveSurfer options:', options);

        // Create the instance - use type casting to avoid TS errors
        const instance = (WaveSurfer as any).create(options);
        wavesurfer.current = instance;
        instanceCreated.current = true;

        // Set up event listeners
        instance.on('ready', () => {
          console.log('WaveSurfer instance ready');
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

        instance.on('error', (err: Error) => {
          console.error('WaveSurfer error:', err);
          if (isMounted.current) {
            setError('Failed to load audio');
            setLoading(false);
          }
        });

        // Load the audio file
        instance.load(audioUrl);
      } catch (err) {
        console.error('Error creating WaveSurfer instance:', err);
        if (isMounted.current) {
          setError('Failed to initialize waveform player');
          setLoading(false);
        }
      }
    };

    createWavesurfer();

    // Cleanup function
    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
      instanceCreated.current = false;
    };
  }, [audioUrl, waveColor, progressColor, height, barWidth, barGap, waveformData]);

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
export const StaticWaveform: React.FC<{
  data: number[],
  progress?: number,
  width?: number|string,
  height?: number|string,
  onScrub?: (relative: number) => void,
  leftPadding?: number // optional, default 0
}> = ({ data, progress = 0, width = '100%', height = 24, onScrub, leftPadding = 0 }) => {
  const maxValue = Math.max(...data, 1);
  // Linear normalization for better dynamics
  const normalizedData = data.map(val => val / maxValue);

  // Use a fixed viewBox for path calculation, SVG itself will scale via width/height props
  const viewBoxWidth = 200; // Arbitrary width for viewBox calculation
  const svgHeight = typeof height === 'number' ? height : 24;
  const totalPoints = viewBoxWidth; // Number of points for the path data, matching viewBoxWidth

  // Interpolate or spread data to fill the totalPoints for the viewBoxWidth
  let stretchedData: number[];
  if (normalizedData.length === 0) { // Handle empty data case
    stretchedData = Array(totalPoints).fill(0);
  } else if (normalizedData.length === totalPoints) {
    stretchedData = normalizedData;
  } else {
    stretchedData = Array.from({ length: totalPoints }, (_, i) => {
      const idx = (i / (totalPoints - 1)) * (normalizedData.length - 1);
      const left = Math.floor(idx);
      const right = Math.ceil(idx);
      if (left === right) return normalizedData[left]; // Avoid issues if idx is an integer
      const frac = idx - left;
      return normalizedData[left] * (1 - frac) + normalizedData[right] * frac;
    });
  }

  const minAmpNormalized = 0.01; // Minimum amplitude as a fraction of svgHeight

  const pathPoints = stretchedData.map((value, i) => {
    const x = leftPadding + (i / (totalPoints - 1)) * (viewBoxWidth - leftPadding);
    const barAmplitude = Math.max(value, minAmpNormalized) * svgHeight;
    const y = (svgHeight - barAmplitude) / 2; // Top of the centered bar
    return `${x},${y}`;
  });

  const pathPointsBottom = stretchedData.map((value, i) => {
    const x = leftPadding + ((totalPoints - 1 - i) / (totalPoints - 1)) * (viewBoxWidth - leftPadding); // Reversed X for path drawing
    const barAmplitude = Math.max(value, minAmpNormalized) * svgHeight;
    const y = (svgHeight + barAmplitude) / 2; // Bottom of the centered bar
    return `${x},${y}`;
  });
  
  const fullPath = stretchedData.length > 0 ? `M${pathPoints[0]} L${pathPoints.slice(1).join(' ')} L${pathPointsBottom.join(' ')} Z` : 'M0,0'; // Fallback for empty data

  const progressIdx = Math.floor((progress || 0) * totalPoints);
  
  let progressPath = '';
  if (stretchedData.length > 0 && progressIdx > 0) {
    const currentProgressPoints = stretchedData.slice(0, progressIdx).map((value, i) => {
        const x = leftPadding + (i / (totalPoints - 1)) * (viewBoxWidth - leftPadding);
        const barAmplitude = Math.max(value, minAmpNormalized) * svgHeight;
        const y = (svgHeight - barAmplitude) / 2;
        return `${x},${y}`;
    });
    const currentProgressPointsBottom = stretchedData.slice(0, progressIdx).map((value, i) => {
        const x = leftPadding + ((progressIdx - 1 - i) / (totalPoints - 1)) * (viewBoxWidth - leftPadding); // Reversed X
        const barAmplitude = Math.max(value, minAmpNormalized) * svgHeight;
        const y = (svgHeight + barAmplitude) / 2;
        return `${x},${y}`;
    });
    if (currentProgressPoints.length > 0) {
        progressPath = `M${currentProgressPoints[0]} L${currentProgressPoints.slice(1).join(' ')} L${currentProgressPointsBottom.join(' ')} Z`;
    }
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!onScrub) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const rel = Math.max(0, Math.min(1, x / rect.width));
    onScrub(rel);
  };
  const isDragging = useRef(false);
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    isDragging.current = true;
    handlePointer(e);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current || !onScrub || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const rel = Math.max(0, Math.min(1, x / rect.width));
    onScrub(rel);
  };
  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  return (
    <svg
      ref={svgRef}
      width={width} // e.g., "100%"
      height={height} // e.g., 24
      viewBox={`0 0 ${viewBoxWidth} ${svgHeight}`}
      preserveAspectRatio="none"
      className="w-full h-full cursor-pointer"
      onPointerDown={onScrub ? handlePointerDown : undefined}
      style={{ marginLeft: 0, paddingLeft: 0 }}
    >
      <path d={fullPath} fill="#4a5568" />
      {progressPath && <path d={progressPath} fill="#1DF7CE" />}
    </svg>
  );
}; 