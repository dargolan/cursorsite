import React from 'react';
import WaveformProgressBar from '../WaveformProgressBar';

interface ProgressSectionProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  formatTime: (time: number) => string;
}

const ProgressSection: React.FC<ProgressSectionProps> = ({
  audioUrl,
  currentTime,
  duration,
  onSeek,
  formatTime,
}) => {
  return (
    <div className="w-full">
      <WaveformProgressBar
        audioUrl={audioUrl}
        currentTime={currentTime}
        duration={duration}
        height={44}
        onSeek={onSeek}
      />
    </div>
  );
};

export default ProgressSection; 