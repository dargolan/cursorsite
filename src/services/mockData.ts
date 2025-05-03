import { Track, Tag } from '../types';

export const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Urban Jungle',
    imageUrl: '/images/track1.jpg',
    audioUrl: '/audio/track1.mp3',
    bpm: 95,
    duration: 180, // 3 minutes in seconds
    tags: [
      { id: '1', name: 'Hip Hop', type: 'genre' },
      { id: '5', name: 'Dark', type: 'mood' },
      { id: '9', name: 'Bass', type: 'instrument' }
    ]
  },
  {
    id: '2',
    title: 'Electric Dreams',
    imageUrl: '/images/track2.jpg',
    audioUrl: '/audio/track2.mp3',
    bpm: 128,
    duration: 210, // 3:30 minutes in seconds
    tags: [
      { id: '2', name: 'Electronic', type: 'genre' },
      { id: '6', name: 'Energetic', type: 'mood' },
      { id: '10', name: 'Synth', type: 'instrument' }
    ]
  },
  {
    id: '3',
    title: 'Sunset Lounge',
    imageUrl: '/images/track3.jpg',
    audioUrl: '/audio/track3.mp3',
    bpm: 85,
    duration: 165, // 2:45 minutes in seconds
    tags: [
      { id: '3', name: 'Lo-Fi', type: 'genre' },
      { id: '7', name: 'Chill', type: 'mood' },
      { id: '11', name: 'Piano', type: 'instrument' }
    ]
  },
  {
    id: '4',
    title: 'Midnight Drive',
    imageUrl: '/images/track4.jpg',
    audioUrl: '/audio/track4.mp3',
    bpm: 110,
    duration: 240, // 4 minutes in seconds
    tags: [
      { id: '4', name: 'Synthwave', type: 'genre' },
      { id: '8', name: 'Nostalgic', type: 'mood' },
      { id: '12', name: 'Drums', type: 'instrument' }
    ]
  },
  {
    id: '5',
    title: 'Morning Light',
    imageUrl: '/images/track5.jpg',
    audioUrl: '/audio/track5.mp3',
    bpm: 75,
    duration: 300, // 5 minutes in seconds
    tags: [
      { id: '13', name: 'Ambient', type: 'genre' },
      { id: '14', name: 'Peaceful', type: 'mood' },
      { id: '15', name: 'Pads', type: 'instrument' }
    ]
  }
]; 