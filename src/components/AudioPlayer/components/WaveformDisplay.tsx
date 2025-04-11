'use client';

import React, { useEffect, useRef } from 'react';

interface WaveformDisplayProps {
  waveform?: number[];
  currentTime: number;
  duration: number;
  onSeek: (percentage: number) => void;
}

export function WaveformDisplay({
  waveform,
  currentTime,
  duration,
  onSeek
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveform) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up colors
    const playedColor = '#1DF7CE';
    const unplayedColor = '#4A4A4A';
    const playedPercentage = duration > 0 ? currentTime / duration : 0;

    // Calculate bar width and spacing
    const totalBars = waveform.length;
    const barWidth = canvas.width / totalBars;
    const barSpacing = 1;

    // Draw waveform
    waveform.forEach((amplitude, index) => {
      const x = index * barWidth;
      const height = Math.max(2, amplitude * canvas.height);
      const y = (canvas.height - height) / 2;

      ctx.fillStyle = index / totalBars <= playedPercentage ? playedColor : unplayedColor;
      ctx.fillRect(x + barSpacing/2, y, barWidth - barSpacing, height);
    });
  }, [waveform, currentTime, duration]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / canvas.width;
    onSeek(percentage);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={100}
      className="w-full h-24 cursor-pointer"
      onClick={handleClick}
    />
  );
} 