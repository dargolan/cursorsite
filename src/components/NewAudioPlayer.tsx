import React, { useState, useEffect, useRef } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { IoPlay, IoPause } from 'react-icons/io5';
import VolumeSlider from './VolumeSlider';
import TimeSlider from './TimeSlider';
import { Track } from '../types';

interface AudioPlayerProps {
  track: Track;
  autoPlay?: boolean;
  className?: string;
}

const NewAudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  autoPlay = false,
  className = '',
}) => {
  const [volume, setVolume] = useState(0.8);
  const [trackUrl, setTrackUrl] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { 
    isPlaying,
    isLoading,
    duration,
    currentTime,
    error,
    play,
    pause,
    toggle,
    seek
  } = useAudioPlayer({
    src: trackUrl,
    trackId: track.id
  });

  useEffect(() => {
    if (track && track.audioUrl) {
      setTrackUrl(track.audioUrl);
    }
  }, [track]);

  useEffect(() => {
    if (autoPlay && trackUrl) {
      play();
    }
  }, [trackUrl, autoPlay, play]);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (time: number) => {
    seek(time);
  };

  return (
    <div className={`flex flex-col bg-gray-900 p-4 rounded-lg ${className}`}>
      <audio 
        ref={audioRef} 
        src={trackUrl}
        preload="metadata"
      />
      
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error.message}
        </div>
      )}
      
      <div className="flex items-center mb-2">
        <div className="mr-3">
          <button
            onClick={toggle}
            disabled={isLoading || !trackUrl}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-black hover:bg-primary-dark disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-t-transparent border-black animate-spin rounded-full" />
            ) : isPlaying ? (
              <IoPause className="h-5 w-5" />
            ) : (
              <IoPlay className="h-5 w-5 ml-0.5" />
            )}
          </button>
        </div>
        
        <div className="flex flex-col flex-grow">
          <div className="text-sm font-semibold text-white truncate">
            {track.title}
          </div>
          <div className="text-xs text-gray-400 truncate">
            {track.tags.find(tag => tag.type === 'genre')?.name || ''}
          </div>
        </div>
        
        <div className="w-24">
          <VolumeSlider 
            volume={volume}
            onVolumeChange={handleVolumeChange}
          />
        </div>
      </div>
      
      <TimeSlider
        currentTime={currentTime}
        duration={duration}
        onChange={handleSeek}
      />
    </div>
  );
};

export default NewAudioPlayer; 