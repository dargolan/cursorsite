'use client';

import React from 'react';
import NewAudioPlayer from '@/components/NewAudioPlayer';
import { Track } from '@/types';

export default function AudioDemoPage() {
  // Sample track data
  const sampleTrack: Track = {
    id: 'demo-track-1',
    title: 'Ambient Soundscape',
    bpm: 85,
    tags: [
      { id: 'tag1', name: 'Ambient', type: 'genre' },
      { id: 'tag2', name: 'Relaxing', type: 'mood' },
      { id: 'tag3', name: 'Synth', type: 'instrument' }
    ],
    duration: 180, // 3 minutes
    imageUrl: '/images/sample-track.jpg',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    hasStems: false,
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-8">New Audio Player Demo</h1>
        
        <div className="mb-8">
          <h2 className="text-white text-xl font-medium mb-4">Standard Player</h2>
          <NewAudioPlayer 
            track={sampleTrack} 
            className="mb-4"
          />
          
          <p className="text-gray-400 mt-4">
            This player demonstrates the new audio component with volume and time controls.
            It features a clean and modern interface with responsive controls.
          </p>
        </div>
        
        <div className="mb-8">
          <h2 className="text-white text-xl font-medium mb-4">Auto-Play Demo</h2>
          <NewAudioPlayer 
            track={{
              ...sampleTrack,
              id: 'demo-track-2',
              title: 'Electronic Beat',
              audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            }}
            autoPlay={true}
            className="mb-4"
          />
          
          <p className="text-gray-400 mt-4">
            This player will automatically start playing when the component loads.
          </p>
        </div>
      </div>
    </div>
  );
} 