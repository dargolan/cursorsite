'use client';

import React, { useRef, useState, useCallback } from 'react';
import { ProgressBarProps } from './types';

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  duration,
  currentTime,
  onProgressChange,
  isInteractive = true
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || !progressBarRef.current) return;
    if (e.target === thumbRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentageClicked = clickX / rect.width;
    onProgressChange(percentageClicked);
  };

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    if (!isInteractive) return;
    e.preventDefault();
    setIsDragging(true);

    document.addEventListener('mousemove', handleThumbDrag);
    document.addEventListener('mouseup', handleThumbRelease);
  };

  const handleThumbDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const posX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, posX / rect.width));
    onProgressChange(percentage);
  }, [isDragging, onProgressChange]);

  const handleThumbRelease = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleThumbDrag);
    document.removeEventListener('mouseup', handleThumbRelease);
  }, [handleThumbDrag]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleThumbDrag);
      document.addEventListener('mouseup', handleThumbRelease);
    }
    return () => {
      document.removeEventListener('mousemove', handleThumbDrag);
      document.removeEventListener('mouseup', handleThumbRelease);
    };
  }, [isDragging, handleThumbDrag, handleThumbRelease]);

  return (
    <div className="flex items-center w-full">
      <div 
        className="relative w-full"
        ref={progressBarRef}
        onClick={handleProgressBarClick}
      >
        {/* Gray track background */}
        <div className="w-full h-[8px] bg-[#3A3A3A] rounded-full cursor-pointer" />
        
        {/* Teal progress fill */}
        <div 
          className="absolute top-0 left-0 h-[8px] bg-[#1DF7CE] rounded-full"
          style={{ width: `${progress}%`, zIndex: 2 }}
        />
        
        {/* Teal dot at the edge of progress */}
        {isInteractive && (
          <div 
            ref={thumbRef}
            onMouseDown={handleThumbMouseDown}
            className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-[#1DF7CE] cursor-pointer"
            style={{ 
              left: `calc(${progress}% - 2px)`, 
              zIndex: 3,
              transform: 'translateY(-50%)'
            }}
          />
        )}
      </div>
      
      <div className="w-20 text-[12.5px] font-normal text-[#999999] whitespace-nowrap ml-2 flex-shrink-0 text-right">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}; 