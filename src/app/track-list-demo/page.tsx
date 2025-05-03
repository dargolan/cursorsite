'use client';

import React, { useState } from 'react';
import { Track, Tag } from '../../types';
import TrackListItem from '../../components/TrackListItem';

export default function TrackListDemo() {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  
  // Sample track data for testing
  const sampleTracks: Track[] = [
    {
      id: '1',
      title: 'Crazy Meme Music',
      artist: 'Internet Producer',
      bpm: 108,
      duration: 142,
      tags: [
        { id: '1', name: 'Internet', type: 'genre' },
        { id: '2', name: 'Upbeat', type: 'mood' }
      ],
      imageUrl: 'https://placehold.co/400x400/1E1E1E/1DF7CE?text=Meme',
      audioUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'
    },
    {
      id: '2',
      title: 'Test',
      artist: 'Test Artist',
      bpm: 153,
      duration: 132,
      tags: [
        { id: '3', name: 'Rock', type: 'genre' }
      ],
      imageUrl: 'https://placehold.co/400x400/1E1E1E/1DF7CE?text=Test',
      audioUrl: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
    },
    {
      id: '3',
      title: 'Elevator Music',
      artist: 'Elevator Guy',
      bpm: 83,
      duration: 191,
      tags: [
        { id: '4', name: 'Internet', type: 'genre' },
        { id: '5', name: 'Relaxed', type: 'mood' }
      ],
      imageUrl: 'https://placehold.co/400x400/1E1E1E/1DF7CE?text=Elevator',
      audioUrl: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'
    },
    {
      id: '4',
      title: 'Lo-Fi Beats',
      artist: 'Chill Producer',
      bpm: 112,
      duration: 189,
      tags: [
        { id: '6', name: 'Lo-Fi', type: 'genre' }
      ],
      imageUrl: 'https://placehold.co/400x400/1E1E1E/1DF7CE?text=Lo-Fi',
      audioUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'
    },
    {
      id: '5',
      title: 'Rock Intro',
      artist: 'Rock Band',
      bpm: 135,
      duration: 132,
      tags: [
        { id: '7', name: 'Upbeat', type: 'mood' }
      ],
      imageUrl: 'https://placehold.co/400x400/1E1E1E/1DF7CE?text=Rock',
      audioUrl: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'
    },
    {
      id: '6',
      title: 'Dramatic Countdown',
      artist: 'Movie Composer',
      bpm: 83,
      duration: 68,
      tags: [
        { id: '8', name: 'Dramatic', type: 'mood' },
        { id: '9', name: 'Relaxed', type: 'mood' },
        { id: '10', name: 'Upbeat', type: 'mood' },
        { id: '11', name: 'Internet', type: 'genre' },
        { id: '12', name: 'Lo-Fi', type: 'genre' },
        { id: '13', name: 'Rock', type: 'genre' }
      ],
      imageUrl: 'https://placehold.co/400x400/1E1E1E/1DF7CE?text=Dramatic',
      audioUrl: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
    }
  ];
  
  const handlePlay = (trackId: string) => {
    setPlayingTrackId(trackId);
  };
  
  const handleStop = () => {
    setPlayingTrackId(null);
  };
  
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <header className="py-6 px-8 border-b border-[#272727]">
        <h1 className="text-3xl font-bold text-[#1DF7CE]">WaveCave</h1>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Track List Demo</h1>
        <p className="mb-6">This page demonstrates the new track list design from the screenshot.</p>
        
        <div className="bg-[#181818] rounded-lg shadow-md overflow-hidden">
          {sampleTracks.map(track => (
            <TrackListItem
              key={track.id}
              track={track}
              isPlaying={playingTrackId === track.id}
              onPlay={() => handlePlay(track.id)}
              onStop={handleStop}
            />
          ))}
        </div>
      </main>
    </div>
  );
} 