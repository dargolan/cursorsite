'use client';

import React, { useRef, useState } from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isInteractive?: boolean;
  progressColor?: string;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  isInteractive = true,
  progressColor = '#1DF7CE',
  backgroundColor = '#3A3A3A'
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const seekTime = percentage * duration;
    
    onSeek(seekTime);
  };
  
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isInteractive) return;
    
    setIsDragging(true);
    
    // Add mouse event listeners for dragging
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const movePosition = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, movePosition / rect.width));
    const seekTime = percentage * duration;
    
    onSeek(seekTime);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    
    // Remove mouse event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };
  
  return (
    <div 
      ref={progressBarRef}
      className={`relative h-2 w-full rounded-full cursor-pointer ${isInteractive ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={handleClick}
    >
      {/* Background track */}
      <div 
        className="absolute inset-0 rounded-full" 
        style={{ backgroundColor }}
      />
      
      {/* Progress fill */}
      <div 
        className="absolute top-0 left-0 h-full rounded-full" 
        style={{ 
          width: `${progressPercentage}%`, 
          backgroundColor: progressColor
        }}
      />
      
      {/* Draggable thumb */}
      {isInteractive && (
        <div 
          className="absolute top-1/2 h-4 w-4 rounded-full bg-white transform -translate-y-1/2 shadow-md"
          style={{ 
            left: `${progressPercentage}%`,
            transform: 'translateY(-50%) translateX(-50%)'
          }}
          onMouseDown={handleDragStart}
        />
      )}
    </div>
  );
};

export default ProgressBar; 