import React, { useState, useRef, useEffect } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
  formatLabel?: (value: number) => string;
  accentColor?: string;
  height?: number;
  hideLabels?: boolean;
}

export default function RangeSlider({
  min,
  max,
  value,
  onChange,
  formatLabel = (val) => String(val),
  accentColor = '#1DF7CE',
  height = 4,
  hideLabels = true
}: RangeSliderProps) {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMax, setIsDraggingMax] = useState(false);
  
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Update local values when props change
  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value]);
  
  // Handle track click
  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const trackWidth = rect.width;
    const offsetX = e.clientX - rect.left;
    
    // Calculate percentage and value
    const percentage = Math.max(0, Math.min(100, (offsetX / trackWidth) * 100));
    const newValue = Math.round(min + (percentage / 100) * (max - min));
    
    // Decide which handle to move based on proximity
    const distToMin = Math.abs(newValue - localMin);
    const distToMax = Math.abs(newValue - localMax);
    
    if (distToMin <= distToMax) {
      // Move min handle if it's closest
      const updatedMin = Math.min(newValue, localMax - 1);
      setLocalMin(updatedMin);
      onChange([updatedMin, localMax]);
    } else {
      // Move max handle if it's closest
      const updatedMax = Math.max(newValue, localMin + 1);
      setLocalMax(updatedMax);
      onChange([localMin, updatedMax]);
    }
  };
  
  // Handle min thumb drag
  const handleMinMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMin(true);
    
    // Attach move and up handlers
    const handleMove = (moveEvent: MouseEvent) => {
      if (!trackRef.current) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const trackWidth = rect.width;
      const offsetX = moveEvent.clientX - rect.left;
      
      // Calculate percentage and value
      const percentage = Math.max(0, Math.min(100, (offsetX / trackWidth) * 100));
      const newValue = Math.round(min + (percentage / 100) * (max - min));
      
      // Ensure min doesn't exceed max - 1
      const newMin = Math.min(newValue, localMax - 1);
      setLocalMin(newMin);
    };
    
    const handleMouseUp = () => {
      // Release handlers
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDraggingMin(false);
      
      // Trigger onChange
      onChange([localMin, localMax]);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle max thumb drag
  const handleMaxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMax(true);
    
    // Attach move and up handlers
    const handleMove = (moveEvent: MouseEvent) => {
      if (!trackRef.current) return;
      
      const rect = trackRef.current.getBoundingClientRect();
      const trackWidth = rect.width;
      const offsetX = moveEvent.clientX - rect.left;
      
      // Calculate percentage and value
      const percentage = Math.max(0, Math.min(100, (offsetX / trackWidth) * 100));
      const newValue = Math.round(min + (percentage / 100) * (max - min));
      
      // Ensure max doesn't go below min + 1
      const newMax = Math.max(newValue, localMin + 1);
      setLocalMax(newMax);
    };
    
    const handleMouseUp = () => {
      // Release handlers
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDraggingMax(false);
      
      // Trigger onChange
      onChange([localMin, localMax]);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Calculate positions
  const minPercentage = ((localMin - min) / (max - min)) * 100;
  const maxPercentage = ((localMax - min) / (max - min)) * 100;
  
  return (
    <div className="py-2">
      {!hideLabels && (
        <div className="flex justify-between mb-2 text-base text-white">
          <span>{formatLabel(localMin)}</span>
          <span>{formatLabel(localMax)}</span>
        </div>
      )}
      
      <div 
        ref={trackRef}
        className="relative w-full cursor-pointer mt-4"
        style={{ height: `${height}px` }}
        onClick={handleTrackClick}
      >
        {/* Background track */}
        <div 
          className="absolute top-0 left-0 right-0 bg-[#282828] rounded-full"
          style={{ height: `${height}px` }}
        />
        
        {/* Selected range */}
        <div 
          className="absolute top-0 rounded-full"
          style={{ 
            left: `${minPercentage}%`, 
            width: `${maxPercentage - minPercentage}%`,
            height: `${height}px`,
            backgroundColor: accentColor 
          }}
        />
        
        {/* Min thumb */}
        <div 
          className={`absolute top-0 w-4 h-4 rounded-full -ml-2 -mt-1.5 cursor-grab ${isDraggingMin ? 'cursor-grabbing' : ''}`}
          style={{ 
            left: `${minPercentage}%`,
            backgroundColor: accentColor,
            border: '2px solid #1B1B1B'
          }}
          onMouseDown={handleMinMouseDown}
          onTouchStart={(e) => {
            e.preventDefault();
            // Handle touch events similarly to mouse events
          }}
        />
        
        {/* Max thumb */}
        <div 
          className={`absolute top-0 w-4 h-4 rounded-full -ml-2 -mt-1.5 cursor-grab ${isDraggingMax ? 'cursor-grabbing' : ''}`}
          style={{ 
            left: `${maxPercentage}%`,
            backgroundColor: accentColor,
            border: '2px solid #1B1B1B'
          }}
          onMouseDown={handleMaxMouseDown}
          onTouchStart={(e) => {
            e.preventDefault();
            // Handle touch events similarly to mouse events
          }}
        />
      </div>
    </div>
  );
} 