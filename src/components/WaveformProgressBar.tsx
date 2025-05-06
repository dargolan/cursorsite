import React, { useEffect, useState, useRef } from 'react';
import { getWaveformUrl } from '../utils/waveform';

interface WaveformProgressBarProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  color?: string;
  height?: number;
  onSeek?: (time: number) => void;
}

interface WaveformData {
  peaks: number[];
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
}

const DEFAULT_COLOR = '#1DF7CE';

function getWaveformPath(peaks: number[], height: number, width: number, progress?: number) {
  const n = peaks.length;
  if (n === 0) return '';
  const step = width / n;
  let path = '';
  let lastX = 0;
  let lastYTop = 0;
  let lastYBottom = 0;
  let cutoffIndex = n;
  
  // Add minimum height factor (3% of total height)
  const minHeightFactor = 0.03;
  
  if (progress !== undefined) {
    cutoffIndex = Math.floor(progress * n);
    if (cutoffIndex < 1) cutoffIndex = 1;
    if (cutoffIndex > n) cutoffIndex = n;
  }
  
  // Top edge (left to right)
  for (let i = 0; i < cutoffIndex; i++) {
    const x = i * step;
    // Apply minimum height to the peak value
    const peakValue = Math.max(peaks[i], minHeightFactor);
    const y = (height - peakValue * height) / 2;
    if (i === 0) {
      path += `M${x},${y}`;
    } else {
      path += `L${x},${y}`;
    }
    lastX = x;
    lastYTop = y;
  }
  
  // Vertical line at the cutoff (top to bottom)
  if (progress !== undefined && cutoffIndex <= n) {
    const x = lastX + step;
    const peakValue = Math.max(peaks[Math.min(cutoffIndex, n - 1)], minHeightFactor);
    const yTop = (height - peakValue * height) / 2;
    const yBottom = (height + peakValue * height) / 2;
    path += `L${x},${yTop}`;
    path += `L${x},${yBottom}`;
    lastX = x;
    lastYBottom = yBottom;
  }
  
  // Bottom edge (right to left)
  for (let i = cutoffIndex - 1; i >= 0; i--) {
    const x = i * step;
    // Apply minimum height to the peak value
    const peakValue = Math.max(peaks[i], minHeightFactor);
    const y = (height + peakValue * height) / 2;
    path += `L${x},${y}`;
    if (i === cutoffIndex - 1) lastYBottom = y;
  }
  path += 'Z';
  return path;
}

export default function WaveformProgressBar({
  audioUrl,
  currentTime,
  duration,
  color = DEFAULT_COLOR,
  height = 44,
  onSeek,
}: WaveformProgressBarProps) {
  const [waveform, setWaveform] = useState<WaveformData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [svgPixelWidth, setSvgPixelWidth] = useState<number>(0);

  useEffect(() => {
    if (!audioUrl) return;
    setLoading(true);
    setError(null);
    const url = getWaveformUrl(audioUrl);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch waveform');
        return res.json();
      })
      .then(data => {
        setWaveform(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Waveform unavailable');
        setLoading(false);
      });
  }, [audioUrl]);

  // Measure SVG width after mount and on resize
  useEffect(() => {
    function updateWidth() {
      if (svgRef.current) {
        setSvgPixelWidth(svgRef.current.getBoundingClientRect().width);
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Update local progress when currentTime changes (but not while dragging)
  useEffect(() => {
    if (!isDragging.current) {
      setLocalProgress(duration > 0 ? Math.min(currentTime / duration, 1) : 0);
    }
  }, [currentTime, duration]);

  // Scrubbing logic
  const handleSeek = (clientX: number) => {
    if (!svgRef.current || !waveform || !duration || !onSeek) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    setLocalProgress(percent);
    onSeek(percent * duration);
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!onSeek) return;
    e.preventDefault();
    isDragging.current = true;
    handleSeek(e.clientX);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDragging.current) {
      handleSeek(e.clientX);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  if (loading) {
    return <div style={{ height }} className="w-full flex items-center justify-center text-xs text-gray-400">Loading waveform...</div>;
  }
  if (error || !waveform) {
    return <div style={{ height }} className="w-full flex items-center justify-center text-xs text-gray-400">{error || 'No waveform'}</div>;
  }

  const { peaks } = waveform;
  const numPeaks = peaks.length;
  const width = svgPixelWidth || 1000;
  const progress = localProgress;

  const fullPath = getWaveformPath(peaks, height, width);
  const progressPath = getWaveformPath(peaks, height, width, progress);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: 'block', cursor: onSeek ? 'pointer' : 'default' }}
      onPointerDown={onSeek ? handlePointerDown : undefined}
    >
      {/* Full waveform background */}
      <path d={fullPath} fill="#444" opacity={0.5} />
      {/* Progress overlay */}
      {progress > 0 && (
        <path d={progressPath} fill={color} opacity={1} />
      )}
    </svg>
  );
} 