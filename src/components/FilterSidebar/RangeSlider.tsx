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
  onDrag?: (range: [number, number]) => void;
}

export default function RangeSlider({
  min,
  max,
  value,
  onChange,
  formatLabel = (val) => String(val),
  accentColor = '#1DF7CE',
  height = 4,
  hideLabels = true,
  onDrag = onChange
}: RangeSliderProps) {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMax, setIsDraggingMax] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const trackRef = useRef<HTMLDivElement>(null);
  const lastValidMinValue = useRef(min);
  const lastValidMaxValue = useRef(max);

  // Initialize with the full range if no values are provided
  useEffect(() => {
    if (!isInitialized) {
      if (value[0] === value[1] || (value[0] === 0 && value[1] === 0)) {
        onChange([min, max]);
        setLocalMin(min);
        setLocalMax(max);
        lastValidMinValue.current = min;
        lastValidMaxValue.current = max;
      } else {
        setLocalMin(value[0]);
        setLocalMax(value[1]);
        lastValidMinValue.current = value[0];
        lastValidMaxValue.current = value[1];
      }
      setIsInitialized(true);
    }
  }, [min, max, value, onChange, isInitialized]);
  
  // Update local values when props change (after initialization)
  useEffect(() => {
    if (isInitialized) {
      setLocalMin(value[0]);
      setLocalMax(value[1]);
      lastValidMinValue.current = value[0];
      lastValidMaxValue.current = value[1];
    }
  }, [value, isInitialized]);
  
  // Convert page position to slider value
  const positionToValue = (positionX: number): number => {
    if (!trackRef.current) return min;
    
    const rect = trackRef.current.getBoundingClientRect();
    const trackWidth = rect.width;
    
    // Clamp position to track bounds
    let clampedX;
    if (positionX < rect.left) {
      clampedX = 0;
    } else if (positionX > rect.right) {
      clampedX = trackWidth;
    } else {
      clampedX = positionX - rect.left;
    }
    
    // Convert to percentage then to value
    const percentage = (clampedX / trackWidth);
    return Math.round(min + percentage * (max - min));
  };

  // Handle track click
  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    
    const newValue = positionToValue(e.clientX);
    
    // Decide which handle to move based on proximity
    const distToMin = Math.abs(newValue - localMin);
    const distToMax = Math.abs(newValue - localMax);
    
    if (distToMin <= distToMax) {
      // Move min handle if it's closest
      const updatedMin = Math.min(newValue, localMax - 1);
      setLocalMin(updatedMin);
      lastValidMinValue.current = updatedMin;
      onDrag([updatedMin, localMax]);
    } else {
      // Move max handle if it's closest
      const updatedMax = Math.max(newValue, localMin + 1);
      setLocalMax(updatedMax);
      lastValidMaxValue.current = updatedMax;
      onDrag([localMin, updatedMax]);
    }
  };
  
  // Handle min thumb drag
  const handleMinMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMin(true);
    
    const handleMove = (moveEvent: MouseEvent) => {
      const newValue = positionToValue(moveEvent.clientX);
      
      // Handle boundary conditions
      let finalValue;
      
      if (moveEvent.clientX < (trackRef.current?.getBoundingClientRect().left || 0)) {
        // Left edge - set to minimum
        finalValue = min;
      } else if (moveEvent.clientX > (trackRef.current?.getBoundingClientRect().right || 0)) {
        // Right edge - constrained by max thumb
        finalValue = Math.min(max, localMax - 1);
      } else {
        // Within track - normal behavior
        finalValue = Math.min(newValue, localMax - 1);
      }
      
      // Update state and remember valid value
      setLocalMin(finalValue);
      lastValidMinValue.current = finalValue;
      onDrag([finalValue, localMax]);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDraggingMin(false);
      
      // Apply the final change - important for when mouse is released outside the track
      onChange([lastValidMinValue.current, localMax]);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle max thumb drag
  const handleMaxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMax(true);
    
    const handleMove = (moveEvent: MouseEvent) => {
      const newValue = positionToValue(moveEvent.clientX);
      
      // Handle boundary conditions
      let finalValue;
      
      if (moveEvent.clientX < (trackRef.current?.getBoundingClientRect().left || 0)) {
        // Left edge - constrained by min thumb
        finalValue = Math.max(min, localMin + 1);
      } else if (moveEvent.clientX > (trackRef.current?.getBoundingClientRect().right || 0)) {
        // Right edge - set to maximum
        finalValue = max;
      } else {
        // Within track - normal behavior
        finalValue = Math.max(newValue, localMin + 1);
      }
      
      // Update state and remember valid value
      setLocalMax(finalValue);
      lastValidMaxValue.current = finalValue;
      onDrag([localMin, finalValue]);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDraggingMax(false);
      
      // Apply the final change - important for when mouse is released outside the track
      onChange([localMin, lastValidMaxValue.current]);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Calculate positions
  const minPercentage = ((localMin - min) / (max - min)) * 100;
  const maxPercentage = ((localMax - min) / (max - min)) * 100;
  
  return (
    <div className="py-0">
      {!hideLabels && (
        <div className="flex justify-between mb-2 text-sm text-white">
          <span>{formatLabel(localMin)}</span>
          <span>{formatLabel(localMax)}</span>
        </div>
      )}
      <div style={{ height: '8px' }} />
      <div 
        ref={trackRef}
        className="relative w-full cursor-pointer"
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
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            handleMinMouseDown(mouseEvent as unknown as React.MouseEvent);
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
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
              clientX: touch.clientX,
              clientY: touch.clientY
            });
            handleMaxMouseDown(mouseEvent as unknown as React.MouseEvent);
          }}
        />
      </div>
    </div>
  );
} 