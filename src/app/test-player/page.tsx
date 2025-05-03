'use client';

import React, { useState } from 'react';
import AudioPlayer from '../../components/AudioPlayer';
import { Tag, Track } from '../../types';

export default function TestPlayerPage() {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  
  // Sample track data for testing
  const sampleTracks: Track[] = [
    {
      id: '1',
      title: 'Sample Track 1',
      artist: 'Test Artist',
      bpm: 128,
      duration: 180,
      genre: 'Electronic',
      price: 9.99,
      tags: [
        { id: '1', name: 'Electronic', type: 'genre' },
        { id: '2', name: 'Upbeat', type: 'mood' }
      ],
      imageUrl: 'https://placehold.co/400x400/1E1E1E/1DF7CE?text=Track+1',
      audioUrl: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'
    },
    {
      id: '2',
      title: 'Sample Track 2',
      artist: 'Another Artist',
      bpm: 110,
      duration: 210,
      genre: 'Hip Hop',
      price: 12.99,
      tags: [
        { id: '3', name: 'Hip Hop', type: 'genre' },
        { id: '4', name: 'Chill', type: 'mood' }
      ],
      imageUrl: 'https://placehold.co/400x400/1E1E1E/1DF7CE?text=Track+2',
      audioUrl: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
    }
  ];
  
  const handlePlay = (trackId: string) => {
    setPlayingTrackId(trackId);
  };
  
  const handleStop = () => {
    setPlayingTrackId(null);
  };
  
  const handleTagClick = (tag: Tag) => {
    console.log('Tag clicked:', tag);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Audio Player Test</h1>
      <p className="mb-6">This page demonstrates the new Audio Player design from the 30-APR-25 branch but without stem functionality.</p>
      
      <div className="space-y-6">
        {sampleTracks.map(track => (
          <AudioPlayer
            key={track.id}
            track={track}
            isPlaying={playingTrackId === track.id}
            onPlay={() => handlePlay(track.id)}
            onStop={handleStop}
            onTagClick={handleTagClick}
          />
        ))}
      </div>
    </div>
  );
} 