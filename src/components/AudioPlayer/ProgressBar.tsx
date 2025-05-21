import React from 'react';

interface ProgressBarProps {
  progress: number;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  // ...other props as needed
}

export default function ProgressBar({ progress, onClick }: ProgressBarProps) {
  return (
    <div className="progress-bar" onClick={onClick}>
      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
    </div>
  );
} 