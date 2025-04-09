'use client';

import React from 'react';
import { formatTime } from '../../utils/format';

interface TimeDisplayProps {
  currentTime: number;
  duration: number;
  className?: string;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  currentTime,
  duration,
  className = ''
}) => {
  return (
    <div className={`text-xs text-white text-opacity-75 font-medium ${className}`}>
      {formatTime(currentTime)} / {formatTime(duration)}
    </div>
  );
};

export default TimeDisplay; 