'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WaveformPlayer, StaticWaveform } from './WaveformPlayer';
import { generateWaveformData } from '../../utils/waveform-utils';

interface LazyWaveformProps {
  audioUrl: string;
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  isVisible?: boolean; // Whether this component is in the viewport
}

export const LazyWaveform: React.FC<LazyWaveformProps> = ({
  audioUrl,
  isPlaying,
  onPlay,
  onPause,
  height = 40,
  waveColor = '#4a5568',
  progressColor = '#3182ce',
  isVisible = true,
}) => {
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  console.log('LazyWaveform rendering with URL:', audioUrl, 'isVisible:', isVisible);

  // Use IntersectionObserver to detect when waveform is visible
  useEffect(() => {
    // Skip if manually controlling visibility or already loaded
    if (isVisible === false || isLoaded) return;
    
    console.log('Setting up IntersectionObserver for LazyWaveform');
    
    try {
      const observer = new IntersectionObserver(
        (entries) => {
          console.log('IntersectionObserver callback fired:', entries[0].isIntersecting);
          if (entries[0].isIntersecting) {
            // If element enters the viewport, load the waveform
            loadWaveform();
            // Disconnect observer once loaded
            observer.disconnect();
          }
        },
        { threshold: 0.1 } // Trigger when at least 10% of the element is visible
      );
      
      if (containerRef.current) {
        observer.observe(containerRef.current);
        console.log('Observing container element');
      } else {
        console.log('Container ref not available yet');
      }
      
      observerRef.current = observer;
      
      return () => {
        console.log('Cleaning up IntersectionObserver');
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    } catch (err) {
      console.error('Error setting up IntersectionObserver:', err);
      // Fallback: load waveform directly if IntersectionObserver fails
      loadWaveform();
    }
  }, [containerRef.current, isLoaded]);

  // If isVisible is manually set to true, load the waveform
  useEffect(() => {
    console.log('isVisible changed:', isVisible, 'isLoaded:', isLoaded, 'isLoading:', isLoading);
    if (isVisible && !isLoaded && !isLoading) {
      console.log('Loading waveform due to isVisible=true');
      loadWaveform();
    }
  }, [isVisible, isLoaded, isLoading]);

  // Load waveform data
  const loadWaveform = async () => {
    if (isLoading || isLoaded) {
      console.log('Skipping loadWaveform - already loading or loaded');
      return;
    }
    
    console.log('Starting to load waveform data for URL:', audioUrl);
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, let's skip the data generation and just render the WaveformPlayer
      // This will help us isolate if the issue is with WaveSurfer or our data generation
      console.log('Skipping waveform data generation, rendering WaveformPlayer directly');
      setIsLoaded(true);
      setWaveformData([0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.6]); // Dummy data
    } catch (err) {
      console.error('Failed to load waveform data:', err);
      setError('Failed to load waveform');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      {isLoading && (
        <div className="h-10 bg-gray-700 animate-pulse rounded-md"></div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      
      {!isLoading && !error && (
        <>
          {isLoaded ? (
            // Use the full interactive WaveformPlayer when loaded
            <WaveformPlayer
              audioUrl={audioUrl}
              isPlaying={isPlaying}
              onPlay={onPlay}
              onPause={onPause}
              height={height}
              waveColor={waveColor}
              progressColor={progressColor}
            />
          ) : (
            // Show a static placeholder before loading
            <div className="h-10 bg-gray-700 rounded-md"></div>
          )}
        </>
      )}
    </div>
  );
}; 