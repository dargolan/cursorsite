import React, { useRef, useEffect, useState } from 'react';

interface WaveformVisualizerProps {
  audioUrl: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  height?: number;
  accentColor?: string;
  backgroundColor?: string;
}

export default function WaveformVisualizer({
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  onSeek,
  height = 64,
  accentColor = '#1DF7CE',
  backgroundColor = '#1E1E1E'
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate waveform data from audio
  useEffect(() => {
    if (!audioUrl) return;
    
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    
    const generateWaveform = async () => {
      setIsLoading(true);
      
      try {
        // Create audio context
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Fetch audio data
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Create analyser
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        // Get waveform data
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Create temporary source to analyze
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        
        // Get frequency data
        analyser.getByteFrequencyData(dataArray);
        
        // Convert to normalized array
        const normalizedData = Array.from(dataArray).map(value => value / 255);
        setWaveformData(normalizedData);
        
        // Clean up
        source.disconnect();
      } catch (error) {
        console.error('Error generating waveform:', error);
        // Fallback: generate random waveform
        const randomData = Array.from({ length: 64 }, () => Math.random() * 0.8);
        setWaveformData(randomData);
      } finally {
        setIsLoading(false);
        
        // Clean up audio context
        if (audioContext) {
          await audioContext.close();
        }
      }
    };
    
    generateWaveform();
    
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioUrl]);
  
  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate playback progress
    const progress = duration > 0 ? currentTime / duration : 0;
    const progressWidth = canvas.width * progress;
    
    // Draw waveform
    const barWidth = canvas.width / waveformData.length;
    const barSpacing = 1;
    
    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * canvas.height * 0.8;
      
      // Draw bar background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        x + barSpacing / 2,
        (canvas.height - barHeight) / 2,
        barWidth - barSpacing,
        barHeight
      );
      
      // Draw played portion
      if (x <= progressWidth) {
        ctx.fillStyle = accentColor;
        ctx.fillRect(
          x + barSpacing / 2,
          (canvas.height - barHeight) / 2,
          barWidth - barSpacing,
          barHeight
        );
      }
    });
  }, [waveformData, currentTime, duration, accentColor, backgroundColor]);
  
  // Handle click to seek
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = offsetX / rect.width;
    const seekTime = percentage * duration;
    
    onSeek(seekTime);
  };
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full cursor-pointer"
      style={{ height: `${height}px` }}
      onClick={handleClick}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1DF7CE] rounded-full animate-spin"></div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          className="w-full h-full"
        />
      )}
      
      {/* Progress overlay */}
      <div 
        className="absolute top-0 left-0 h-full bg-[#1DF7CE] opacity-20 pointer-events-none"
        style={{ width: `${(currentTime / duration) * 100}%` }}
      />
      
      {/* Playhead */}
      <div 
        className="absolute top-0 w-0.5 h-full bg-[#1DF7CE] pointer-events-none"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />
    </div>
  );
} 