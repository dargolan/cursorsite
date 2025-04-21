import React, { useState, useRef } from 'react';

interface TimeSliderProps {
  currentTime: number;
  duration: number;
  onChange: (time: number) => void;
  className?: string;
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  currentTime,
  duration,
  onChange,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds)) return '0:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSliderClick = (e: React.MouseEvent) => {
    if (!sliderRef.current || duration === 0) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    const newTime = Math.max(0, Math.min(duration, percentage * duration));
    
    onChange(newTime);
  };

  const startDragging = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSliderClick(e);
    
    const onMouseMove = (e: MouseEvent) => {
      handleSliderClick(e as unknown as React.MouseEvent);
    };
    
    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className="text-xs text-gray-400 w-10">
        {formatTime(currentTime)}
      </div>
      
      <div 
        ref={sliderRef}
        className="relative h-1 flex-grow mx-2 bg-gray-700 rounded cursor-pointer"
        onClick={handleSliderClick}
        onMouseDown={startDragging}
      >
        <div 
          className="absolute h-full bg-primary rounded"
          style={{ width: `${progress}%` }}
        />
        <div 
          className="absolute h-3 w-3 bg-white rounded-full -mt-1 -ml-1.5 shadow"
          style={{ 
            left: `${progress}%`,
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        />
      </div>
      
      <div className="text-xs text-gray-400 w-10 text-right">
        {formatTime(duration)}
      </div>
    </div>
  );
};

export default TimeSlider; 