export interface Tag {
  id: string;
  name: string;
  type: 'genre' | 'mood' | 'instrument';
  parent?: string;
  count?: number;
}

export interface Track {
  id: string;
  title: string;
  bpm: number;
  tags: Tag[];
  duration: number;
  imageUrl: string;
  audioUrl: string;
  waveform?: number[];
}

export interface CartItem {
  id: string;
  type: 'track';
  price: number;
  name: string;
  trackTitle: string;
  imageUrl: string;
} 