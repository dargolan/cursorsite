'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Track, Tag } from '@/types';
import { Controls } from './components/Controls';
import { WaveformDisplay } from './components/WaveformDisplay';
import { StemList } from './components/StemList';
import { stemUrlCache } from './StemUrlCache';
import { strapiFileManager } from './StrapiFileManager';

interface AudioPlayerProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onTagClick: (tag: Tag) => void;
  openStemsTrackId: string | null;
  setOpenStemsTrackId: (id: string | null) => void;
}

export default function AudioPlayer({
  track,
  isPlaying,
  onPlay,
  onStop,
  onTagClick,
  openStemsTrackId,
  setOpenStemsTrackId
}: AudioPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playingStemId, setPlayingStemId] = useState<string | null>(null);
  const [showStems, setShowStems] = useState(false);

  useEffect(() => {
    // Reset state when track changes
    setCurrentTime(0);
    setDuration(0);
    setPlayingStemId(null);
    setShowStems(false);
  }, [track.id]);

  const handleStemPlay = async (stemId: string) => {
    setPlayingStemId(stemId);
  };

  const handleStemStop = (stemId: string) => {
    setPlayingStemId(null);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (dur: number) => {
    setDuration(dur);
  };

  const toggleStems = () => {
    if (showStems) {
      setShowStems(false);
      setOpenStemsTrackId(null);
    } else {
      setShowStems(true);
      setOpenStemsTrackId(track.id);
    }
  };

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-6">
        {/* Track Image */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={track.imageUrl}
            alt={track.title}
            fill
            className="object-cover rounded-lg"
          />
        </div>

        <div className="flex-1">
          {/* Track Info */}
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2">{track.title}</h2>
            <div className="flex flex-wrap gap-2">
              {track.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onTagClick(tag)}
                  className="px-3 py-1 text-sm bg-[#333] rounded-full hover:bg-[#444] transition-colors"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Controls */}
          <Controls
            audioUrl={track.audioUrl}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onStop={onStop}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
          />

          {/* Waveform */}
          {track.waveform && (
            <div className="mt-4">
              <WaveformDisplay
                waveform={track.waveform}
                currentTime={currentTime}
                duration={duration}
                onSeek={(percentage) => {
                  const newTime = duration * percentage;
                  setCurrentTime(newTime);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stems Section */}
      {track.hasStems && (
        <div className="mt-6">
          <button
            onClick={toggleStems}
            className="w-full px-4 py-2 bg-[#333] rounded-lg hover:bg-[#444] transition-colors flex items-center justify-center space-x-2"
          >
            <span>{showStems ? 'Hide Stems' : 'Show Stems'}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                showStems ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showStems && track.stems && (
            <div className="mt-4">
              <StemList
                stems={track.stems}
                trackTitle={track.title}
                imageUrl={track.imageUrl}
                playingStemId={playingStemId}
                onStemPlay={handleStemPlay}
                onStemStop={handleStemStop}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
} 