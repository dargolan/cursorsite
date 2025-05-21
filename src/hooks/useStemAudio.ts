import { useState, useEffect, useCallback } from 'react';
import { Stem } from '../types';
import { getValidUrl, saveStemUrlToCache } from '../utils/stem-url-manager';
import { toCdnUrl } from '../utils/cdn-url';
import { globalAudioManager } from '../components/AudioPlayer';

interface UseStemAudioProps {
  stems: Stem[];
  trackTitle: string;
  trackId: string;
  isPlaying: boolean;
  onStop: () => void;
}

export function useStemAudio({
  stems,
  trackTitle,
  trackId,
  isPlaying,
  onStop
}: UseStemAudioProps) {
  const [stemAudio, setStemAudio] = useState<Record<string, HTMLAudioElement>>({});
  const [playingStems, setPlayingStems] = useState<Record<string, boolean>>({});
  const [stemProgress, setStemProgress] = useState<Record<string, number>>({});
  const [stemLoadErrors, setStemLoadErrors] = useState<Record<string, boolean>>({});
  const [stemLoading, setStemLoading] = useState<Record<string, boolean>>({});
  const [progressIntervals, setProgressIntervals] = useState<Record<string, number>>({});

  // Initialize audio elements
  useEffect(() => {
    console.log('Initializing stem audio elements for track:', trackTitle);
    
    const newStemAudio: Record<string, HTMLAudioElement> = {};
    
    if (stems) {
      console.log('Number of stems:', stems.length);
      
      stems.forEach(stem => {
        if (!stemAudio[stem.id]) {
          try {
            // Mark the stem as loading
            setStemLoading(prev => ({...prev, [stem.id]: true}));
            
            // Get the stem URL
            getValidUrl(stem.name, trackTitle).then(url => {
              if (url) {
                const initialUrl = toCdnUrl(url);
                console.log(`Initial URL for stem ${stem.name}: ${initialUrl}`);
                
                // Create audio element
                const audio = new Audio();
                audio.crossOrigin = "anonymous";
                audio.dataset.stem = stem.name;
                audio.dataset.track = trackTitle;
                audio.dataset.stemId = stem.id;
                audio.dataset.trackId = trackId;
                audio.src = initialUrl;
                
                // Use a timeout to avoid hanging on loading forever
                const loadTimeout = setTimeout(() => {
                  console.warn(`Timeout loading audio for ${stem.name}`);
                  setStemLoadErrors(prev => ({...prev, [stem.id]: true}));
                  setStemLoading(prev => ({...prev, [stem.id]: false}));
                }, 5000);
                
                // Add error handler
                audio.addEventListener('error', (e) => {
                  console.error(`Error loading audio for stem ${stem.name}:`, e);
                  clearTimeout(loadTimeout);
                  setStemLoadErrors(prev => ({...prev, [stem.id]: true}));
                  setStemLoading(prev => ({...prev, [stem.id]: false}));
                });
                
                // Add canplaythrough handler
                audio.addEventListener('canplaythrough', () => {
                  clearTimeout(loadTimeout);
                  console.log(`Audio loaded successfully for stem: ${stem.name}`);
                  setStemLoading(prev => ({...prev, [stem.id]: false}));
                  setStemLoadErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors[stem.id];
                    return newErrors;
                  });
                });
                
                // Set up event handlers for audio playback
                audio.addEventListener('timeupdate', () => {
                  const current = audio.currentTime;
                  const duration = audio.duration || stem.duration || 30;
                  setStemProgress(prev => ({...prev, [stem.id]: (current / duration) * 100}));
                });
                
                audio.addEventListener('ended', () => {
                  setPlayingStems(prev => ({...prev, [stem.id]: false}));
                  setStemProgress(prev => ({...prev, [stem.id]: 0}));
                });
                
                // Preload the audio
                audio.load();
                
                newStemAudio[stem.id] = audio;
              } else {
                console.error(`No valid URL found for stem ${stem.name}`);
                setStemLoadErrors(prev => ({...prev, [stem.id]: true}));
                setStemLoading(prev => ({...prev, [stem.id]: false}));
              }
            }).catch(err => {
              console.error(`Error getting URL for stem ${stem.name}:`, err);
              setStemLoadErrors(prev => ({...prev, [stem.id]: true}));
              setStemLoading(prev => ({...prev, [stem.id]: false}));
            });
          } catch (err) {
            console.error(`Failed to create audio element for ${stem.name}:`, err);
            setStemLoadErrors(prev => ({...prev, [stem.id]: true}));
            setStemLoading(prev => ({...prev, [stem.id]: false}));
          }
        }
      });
    }
    
    // Update the stem audio state
    setStemAudio(prev => ({...prev, ...newStemAudio}));
    
    return () => {
      // Clean up audio elements when component unmounts or track changes
      Object.values(newStemAudio).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [trackId, stems, trackTitle]);

  // Handle stem play/pause
  const handleStemPlayPause = useCallback((stemId: string) => {
    const audio = stemAudio[stemId];
    if (!audio) return;

    if (playingStems[stemId]) {
      audio.pause();
      setPlayingStems(prev => ({...prev, [stemId]: false}));
    } else {
      // Stop any other playing stems
      Object.entries(playingStems).forEach(([id, isPlaying]) => {
        if (isPlaying && stemAudio[id]) {
          stemAudio[id].pause();
          setPlayingStems(prev => ({...prev, [id]: false}));
        }
      });

      // Play the selected stem
      audio.play().catch(err => {
        console.error(`Error playing stem ${stemId}:`, err);
        setStemLoadErrors(prev => ({...prev, [stemId]: true}));
      });
      setPlayingStems(prev => ({...prev, [stemId]: true}));
    }
  }, [stemAudio, playingStems]);

  // Add special effect to allow "play" simulation for stems even when audio fails
  useEffect(() => {
    Object.entries(stemLoadErrors).forEach(([stemId, hasError]) => {
      if (hasError && playingStems[stemId]) {
        if (!progressIntervals[stemId]) {
          console.log(`Setting up progress simulation for stem ${stemId}`);
          const interval = window.setInterval(() => {
            setStemProgress(prev => {
              const current = prev[stemId] || 0;
              if (current >= 100) {
                return {...prev, [stemId]: 0};
              }
              return {...prev, [stemId]: current + 0.5};
            });
          }, 100);
          
          setProgressIntervals(prev => ({...prev, [stemId]: interval}));
        }
      } else if (progressIntervals[stemId] && (!playingStems[stemId] || !hasError)) {
        window.clearInterval(progressIntervals[stemId]);
        setProgressIntervals(prev => {
          const newIntervals = {...prev};
          delete newIntervals[stemId];
          return newIntervals;
        });
        
        if (!playingStems[stemId]) {
          setStemProgress(prev => ({...prev, [stemId]: 0}));
        }
      }
    });
    
    return () => {
      Object.values(progressIntervals).forEach(interval => {
        window.clearInterval(interval);
      });
    };
  }, [stemLoadErrors, playingStems, progressIntervals]);

  return {
    stemAudio,
    setStemAudio,
    playingStems,
    setPlayingStems,
    stemProgress,
    setStemProgress,
    stemLoadErrors,
    setStemLoadErrors,
    stemLoading,
    setStemLoading,
    progressIntervals,
    setProgressIntervals,
    handleStemPlayPause,
  };
} 