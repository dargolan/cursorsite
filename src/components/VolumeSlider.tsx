import React, { useState, useRef } from 'react';
import { IoVolumeMedium, IoVolumeMute } from 'react-icons/io5';

export interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({
  volume,
  onVolumeChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const previousVolume = useRef(volume);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clickPos = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, clickPos / rect.width));
    
    onVolumeChange(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const pos = moveEvent.clientX - rect.left;
      const newVolume = Math.max(0, Math.min(1, pos / rect.width));
      
      onVolumeChange(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(previousVolume.current || 0.5);
    } else {
      setIsMuted(true);
      previousVolume.current = volume;
      onVolumeChange(0);
    }
  };

  return (
    <div className="flex items-center">
      <button
        className="text-gray-400 hover:text-white mr-2"
        onClick={toggleMute}
      >
        {volume === 0 || isMuted ? (
          <IoVolumeMute className="h-4 w-4" />
        ) : (
          <IoVolumeMedium className="h-4 w-4" />
        )}
      </button>
      
      <div 
        className="relative h-1 rounded-full bg-gray-700 w-full"
        ref={sliderRef}
        onClick={handleSliderClick}
      >
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ width: `${volume * 100}%` }}
        ></div>
        
        <div
          className="absolute w-3 h-3 rounded-full bg-white transform -translate-y-1/2 -translate-x-1/2 cursor-grab"
          style={{ 
            left: `${volume * 100}%`, 
            top: '50%',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
        ></div>
      </div>
    </div>
  );
};

export default VolumeSlider; 